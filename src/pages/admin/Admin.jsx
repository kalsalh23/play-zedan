import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Gamepad2, LogOut, RefreshCw, Search, Wallet, Clock, CheckCircle2, XCircle,
  RotateCcw, PackageSearch, Settings, Boxes, BarChart3, Loader2, Eye, EyeOff, Coins, ImageOff, TriangleAlert,
} from 'lucide-react'
import { api, setAdminToken, getAdminToken } from '../../lib/api'
import { fmtUSD, fmtDate, cn } from '../../lib/utils'
import { STATUS_META, StatusBadge } from '../../components/Status'
import { supabase } from '../../lib/supabase'

const STATUS_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'awaiting_payment', label: 'بانتظار الدفع' },
  { key: 'paid', label: 'مدفوعة' },
  { key: 'processing', label: 'جارٍ الشحن' },
  { key: 'completed', label: 'مكتملة' },
  { key: 'cancelled', label: 'ملغاة' },
  { key: 'failed', label: 'فاشلة' },
  { key: 'refunded', label: 'مُرجعة' },
]

const TABS = [
  { key: 'orders', label: 'الطلبات', icon: PackageSearch },
  { key: 'products', label: 'المنتجات', icon: Boxes },
  { key: 'settings', label: 'الإعدادات', icon: Settings },
  { key: 'balance', label: 'الرصيد', icon: BarChart3 },
]

function ActionButton({ order, action, label, icon: Icon, cls, needConfirm }) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <button
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation()
        if (needConfirm && !armed) {
          setArmed(true)
          setTimeout(() => setArmed(false), 4000)
          return
        }
        setBusy(true)
        try {
          const r = await api.adminAction({ id: order.id, action })
          toast.success(r.message)
        } catch (e2) {
          toast.error(e2.message)
        } finally {
          setBusy(false)
          setArmed(false)
        }
      }}
      className={cn('btn btn-sm !px-3 !py-1.5 !text-[10px]', cls, armed && needConfirm && '!bg-rose !text-white')}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {armed && needConfirm ? 'متأكد؟' : label}
    </button>
  )
}

function OrderCard({ order }) {
  const m = STATUS_META[order.status] || {}
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-chip px-2 py-0.5 text-[11px] font-black tracking-widest text-plum" dir="ltr">{order.code}</span>
        <StatusBadge status={order.status} />
        <span className="text-[10px] font-bold text-smoke">{fmtDate(order.created_at)}</span>
        <span className="mr-auto text-sm font-black text-plum">{fmtUSD(order.sell_price)}<span className="text-[9px] font-bold text-smoke"> (مطلوب: {order.pay_amount})</span></span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-smoke">
        <span className="text-ink">{order.product_name}</span>
        <span>الحساب: <b dir="ltr" className="text-ink">{order.id_user}</b></span>
        {Number(order.amount) > 1 && <span>كمية: {order.amount}</span>}
        {order.customer_wallet && <span>محفظة الزبون: <b dir="ltr" className="text-ink">{order.customer_wallet}</b></span>}
        {order.mc_bill_id && <span>فاتورة المزود: {order.mc_bill_id}</span>}
      </div>
      {order.cancel_note && <p className="mt-1.5 rounded-xl bg-rose/5 px-3 py-1.5 text-[10px] font-bold text-rose">{order.cancel_note}</p>}
      {order.result_code && <p className="mt-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-600">الكود: {order.result_code}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {order.status === 'awaiting_payment' && (
          <>
            <ActionButton order={order} action="confirm" label="تأكيد استلام المبلغ وبدء الشحن" icon={CheckCircle2} cls="btn-gradient" needConfirm />
            <ActionButton order={order} action="cancel" label="إلغاء" icon={XCircle} cls="btn-ghost !text-rose hover:!bg-rose/10" needConfirm />
          </>
        )}
        {order.status === 'processing' && (
          <ActionButton order={order} action="check" label="فحص الحالة لدى المزود" icon={RefreshCw} cls="btn-soft" />
        )}
        {order.status === 'processing' && (
          <ActionButton order={order} action="complete" label="إكمال يدوي" icon={CheckCircle2} cls="btn-ghost" needConfirm />
        )}
        {['failed', 'cancelled'].includes(order.status) && (
          <>
            <ActionButton order={order} action="retry" label="إعادة المحاولة" icon={RotateCcw} cls="btn-soft" />
            <ActionButton order={order} action="refund" label="تأشير: مُرجع للزبون" icon={Wallet} cls="btn-ghost !text-plum" needConfirm />
          </>
        )}
      </div>
    </div>
  )
}

function OrdersTab() {
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (s = status, query = q) => {
    try {
      const r = await api.adminOrders(s, query)
      setData(r)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [status, q])

  useEffect(() => {
    setLoading(true)
    load()
    const t = setInterval(() => load(), 12000)
    return () => clearInterval(t)
  }, [status])

  useEffect(() => {
    const handler = () => load()
    window.addEventListener('mb:orders-changed', handler)
    return () => window.removeEventListener('mb:orders-changed', handler)
  }, [load])

  const stats = data?.stats
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'إيراد اليوم', val: fmtUSD(stats?.revenueToday || 0), icon: Coins, cls: 'bg-emerald-50 text-emerald-600' },
          { label: 'الإيراد الكلي', val: fmtUSD(stats?.revenueTotal || 0), icon: BarChart3, cls: 'bg-chip text-plum' },
          { label: 'بانتظار التأكيد', val: stats?.by?.awaiting_payment || 0, icon: Clock, cls: 'bg-gold-soft text-gold-dark' },
          { label: 'جارٍ شحنها', val: stats?.by?.processing || 0, icon: Loader2, cls: 'bg-indigo-50 text-indigo-600' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-3 p-4">
            <span className={cn('grid h-10 w-10 place-items-center rounded-2xl', s.cls)}><s.icon className="h-5 w-5" /></span>
            <div><p className="text-[10px] font-black text-smoke">{s.label}</p><p className="text-sm font-black text-ink">{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {STATUS_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)} className={cn('chip', status === f.key && 'chip-active')}>
            {f.label} {f.key !== 'all' && stats?.by?.[f.key] ? `(${stats.by[f.key]})` : ''}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(status, q) }} className="card flex gap-2 p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث برقم الطلب / الحساب / المنتج" className="field !py-2.5" />
        <button className="btn-primary !px-4 !py-2.5"><Search className="h-4 w-4" /></button>
      </form>

      {loading && !data ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}</div>
      ) : (data?.orders || []).length === 0 ? (
        <div className="card p-8 text-center text-xs font-bold text-smoke">لا توجد طلبات هنا</div>
      ) : (
        <div className="space-y-3">
          {data.orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  )
}

function ProductsTab() {
  const [products, setProducts] = useState(null)
  const [q, setQ] = useState('')
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(() => {
    supabase.from('products').select('*').order('top_category_id').then(({ data }) => setProducts(data || []))
  }, [])
  useEffect(load, [load])

  async function sync() {
    setSyncing(true)
    try {
      const r = await api.adminSync()
      toast.success(r.message)
      load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSyncing(false)
    }
  }

  async function toggleHidden(p) {
    try {
      await api.adminProduct({ mc_id: p.mc_id, is_hidden: !p.is_hidden })
      setProducts((ps) => ps.map((x) => (x.mc_id === p.mc_id ? { ...x, is_hidden: !x.is_hidden } : x)))
    } catch (e) {
      toast.error(e.message)
    }
  }

  const filtered = useMemo(
    () => (products || []).filter((p) => !q || (p.name + p.department_name + p.top_category_name).includes(q)).slice(0, 120),
    [products, q]
  )

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <button onClick={sync} disabled={syncing} className="btn-gradient !py-2.5">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          مزامنة المنتجات من Market-Card
        </button>
        <span className="text-[10px] font-bold text-smoke">تجلب الأقسام والمنتجات وأسعار الجملة ويُحسب سعرك تلقائياً</span>
      </div>
      <div className="card flex items-center gap-2 p-3">
        <Search className="h-4 w-4 text-smoke" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث في المنتجات" className="w-full bg-transparent text-sm font-bold outline-none" />
      </div>
      {!products ? (
        <div className="skeleton h-64" />
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-xs font-bold text-smoke">لا توجد منتجات — اضغط "مزامنة المنتجات"</div>
      ) : (
        <div className="card divide-y divide-chip overflow-hidden">
          {filtered.map((p) => (
            <div key={p.mc_id} className={cn('flex items-center gap-3 p-3', p.is_hidden && 'opacity-50')}>
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-chip">
                {p.img ? <img src={p.img} className="h-full w-full object-cover" alt="" /> : <ImageOff className="h-4 w-4 text-plum/30" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-ink">{p.name}</p>
                <p className="truncate text-[10px] font-bold text-smoke">{p.top_category_name} › {p.department_name} • #{p.mc_id}</p>
              </div>
              <span className="shrink-0 text-[11px] font-black text-plum">{Number(p.sell_unit_price) > 0 ? fmtUSD(p.sell_unit_price) : '—'}</span>
              <button onClick={() => toggleHidden(p)} className={cn('btn btn-sm !px-2 !py-1.5', p.is_hidden ? 'btn-soft' : 'btn-ghost')} title={p.is_hidden ? 'إظهار' : 'إخفاء'}>
                {p.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsTab() {
  const [s, setS] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newPass, setNewPass] = useState('')

  useEffect(() => {
    api.adminSettings().then((r) => setS(r.settings)).catch((e) => toast.error(e.message))
  }, [])

  if (!s) return <div className="skeleton h-96" />
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value })

  async function save() {
    setSaving(true)
    try {
      const payload = { ...s }
      if (newPass) payload.admin_password = newPass
      const r = await api.adminSaveSettings(payload)
      if (r.token) setAdminToken(r.token)
      setNewPass('')
      toast.success(r.message)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5">
        <h3 className="text-sm font-black text-ink">هوية المتجر والدفع</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label">اسم المتجر</label><input value={s.store_name} onChange={set('store_name')} className="field" /></div>
          <div><label className="field-label">الشعار الفرعي</label><input value={s.store_tagline} onChange={set('store_tagline')} className="field" /></div>
          <div><label className="field-label">رقم محفظة شام كاش</label><input value={s.shamcash_number} onChange={set('shamcash_number')} className="field" dir="ltr" placeholder="09xxxxxxxx" /></div>
          <div><label className="field-label">اسم صاحب المحفظة</label><input value={s.shamcash_name} onChange={set('shamcash_name')} className="field" /></div>
          <div><label className="field-label">هامش الربح %</label><input type="number" value={s.markup_percent} onChange={set('markup_percent')} className="field" /></div>
          <div className="sm:col-span-2 rounded-2xl bg-chip/60 p-3 text-[10px] font-bold leading-5 text-smoke">الأسعار تُعرض وتُحسب بالدولار الأمريكي مباشرة (سعر الجملة + هامش الربح) — والدفع عبر رصيد شام كاش الدولاري.</div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="text-sm font-black text-ink">حساب Market-Card (مزود الجملة)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label">اسم المستخدم</label><input value={s.mc_username} onChange={set('mc_username')} className="field" dir="ltr" /></div>
          <div><label className="field-label">كلمة المرور</label><input type="password" value={s.mc_password} onChange={set('mc_password')} className="field" dir="ltr" /></div>
          <div><label className="field-label">كلمة سر الشراء (إن فعّلتها في حسابك)</label><input type="password" value={s.mc_purchase_password} onChange={set('mc_purchase_password')} className="field" dir="ltr" /></div>
          <div>
            <label className="field-label">وضع العرض التجريبي</label>
            <select value={s.mc_demo} onChange={set('mc_demo')} className="field cursor-pointer">
              <option value="true">مفعّل — محاكاة الشحن بدون حساب حقيقي</option>
              <option value="false">مطفأ — التنفيذ عبر حساب Market-Card</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="text-sm font-black text-ink">بانر العروض (الشاشة الرئيسية)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label">شارة العرض (أعلى البانر)</label><input value={s.hero_badge} onChange={set('hero_badge')} className="field" placeholder="عرض محدود 🔥" /></div>
          <div><label className="field-label">العنوان الرئيسي</label><input value={s.hero_title} onChange={set('hero_title')} className="field" placeholder="خصومات حتى 20%" /></div>
          <div className="sm:col-span-2"><label className="field-label">الوصف</label><textarea value={s.hero_subtitle} onChange={set('hero_subtitle')} className="field !min-h-[70px]" /></div>
          <div><label className="field-label">نص الزر</label><input value={s.hero_btn} onChange={set('hero_btn')} className="field" placeholder="تصفح العروض" /></div>
          <div><label className="field-label">رابط الزر</label><input value={s.hero_link} onChange={set('hero_link')} className="field" dir="ltr" placeholder="/categories" /></div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="text-sm font-black text-ink">بانرات إعلانات الشاشة الرئيسية</h3>
        <BannersManager />
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="text-sm font-black text-ink">الأمان</h3>
        <div><label className="field-label">كلمة مرور جديدة للوحة</label><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="field" placeholder="اتركها فارغة لعدم التغيير" /></div>
      </div>

      <button onClick={save} disabled={saving} className="btn-gradient w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ كل الإعدادات'}
      </button>
    </div>
  )
}

function BalanceTab() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    api.adminBalance().then(setData).catch((e) => setErr(e.message))
  }, [])
  if (err) return <div className="card p-6 text-center text-xs font-black text-rose">{err}</div>
  if (!data) return <div className="skeleton h-64" />
  const user = data.profile?.user || {}
  const rows = data.balances?.balances || []
  return (
    <div className="space-y-4">
      {data.demo && (
        <div className="card flex items-center gap-2 border-2 border-gold/40 bg-gold-soft p-4 text-xs font-black text-gold-dark">
          <TriangleAlert className="h-4 w-4" /> وضع تجريبي — بيانات وهمية. أدخل حساب Market-Card في الإعدادات لعرض رصيدك الحقيقي.
        </div>
      )}
      <div className="card flex items-center gap-4 p-5">
        <span className="grid h-14 w-14 place-items-center rounded-3xl hero-gradient text-white"><Wallet className="h-7 w-7" /></span>
        <div>
          <p className="text-[11px] font-black text-smoke">{user.name || '—'} • {user.group?.name || ''}</p>
          <p className="text-2xl font-black text-plum">{Number(user.balance || 0).toLocaleString('en-US')} <span className="text-sm">$</span></p>
          <p className="text-[10px] font-bold text-smoke">الرصيد المتاح لدى Market-Card</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-chip bg-chip/50 px-4 py-2.5 text-xs font-black text-ink">سجل الحركات</div>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-xs font-bold text-smoke">لا توجد حركات</p>
        ) : (
          <div className="divide-y divide-chip">
            {rows.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 p-3.5 text-[11px]">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{b.info}</p>
                  <p className="text-[9px] font-bold text-smoke">{b.created_at}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className={cn('font-black', Number(b.credit) > 0 ? 'text-emerald-600' : 'text-rose')}>
                    {Number(b.credit) > 0 ? '+' : '-'}{Math.max(Number(b.credit), Number(b.debit)).toFixed(2)} $
                  </p>
                  <p className="text-[9px] font-bold text-smoke">الإجمالي: {b.total}$</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BannersManager() {
  const [list, setList] = useState(null)
  const [link, setLink] = useState('/categories')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(() => {
    api.banners().then((r) => setList(r.banners || [])).catch((e) => toast.error(e.message))
  }, [])
  useEffect(load, [load])

  async function upload() {
    const file = fileRef.current && fileRef.current.files && fileRef.current.files[0]
    if (!file) return toast.error('اختر صورة أولاً')
    if (file.size > 3.5 * 1024 * 1024) return toast.error('حجم الصورة كبير (الحد 3.5MB)')
    setBusy(true)
    try {
      const b64 = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result).split(',')[1])
        r.onerror = reject
        r.readAsDataURL(file)
      })
      const r = await api.adminBanners({ action: 'add', image_b64: b64, link })
      toast.success(r.message)
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function del(id) {
    if (!window.confirm('حذف هذا البانر؟')) return
    try {
      const r = await api.adminBanners({ action: 'delete', id })
      toast.success(r.message)
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="field !py-2 !text-xs flex-1 min-w-[180px]" />
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="رابط البانر" className="field !py-2 !text-xs w-36" dir="ltr" />
        <button onClick={upload} disabled={busy} className="btn-gradient btn-sm shrink-0">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'إضافة بانر'}
        </button>
      </div>
      <p className="text-[10px] font-bold text-smoke">يفضّل صورة عريضة (مثال 1200×420) — تُعرض بالتناوب أعلى الشاشة الرئيسية</p>
      {!list ? (
        <div className="skeleton h-20" />
      ) : list.length === 0 ? (
        <p className="text-xs font-bold text-smoke">لا توجد بانرات — تُعرض البانرات الافتراضية النصية بدلاً منها</p>
      ) : (
        <div className="space-y-2">
          {list.map((b, i) => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl border-2 border-chip p-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-chip text-[11px] font-black text-plum">{i + 1}</span>
              <img src={b.img} alt="" className="h-12 flex-1 rounded-xl object-cover" />
              <span className="shrink-0 text-[10px] font-bold text-smoke" dir="ltr">{b.link}</span>
              <button onClick={() => del(b.id)} className="btn btn-sm !px-2.5 !py-1.5 !text-[10px] !bg-rose/10 !text-rose hover:!bg-rose hover:!text-white shrink-0">حذف</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')

  useEffect(() => {
    if (!getAdminToken()) navigate('/admin')
  }, [navigate])

  return (
    <div className="min-h-screen bg-lilac">
      <header className="hero-gradient sticky top-0 z-40 text-white shadow-lg">
        <div className="container-app flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Gamepad2 className="h-5 w-5" /></span>
            <div className="leading-tight">
              <p className="text-sm font-black">لوحة إدارة MOBILY BRO+</p>
              <p className="text-[10px] font-bold text-white/70">بإدارة أيمن زيدان</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" className="btn !px-3 !py-2 text-[11px] font-black text-white/90 hover:bg-white/10">المتجر</Link>
            <button
              onClick={() => { setAdminToken(''); navigate('/admin') }}
              className="btn !px-3 !py-2 text-white/90 hover:bg-white/10"
              title="خروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="container-app py-5">
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn('chip !px-4 !py-2', tab === t.key && 'chip-active')}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && <OrdersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'balance' && <BalanceTab />}
      </div>
    </div>
  )
}
