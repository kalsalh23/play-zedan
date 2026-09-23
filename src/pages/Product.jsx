import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Zap, ShieldCheck, Clock, ImageOff, ChevronLeft, Wallet, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { fmtSYP, round100 } from '../lib/utils'

export default function Product() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [idUser, setIdUser] = useState('')
  const [qty, setQty] = useState(0)
  const [wallet, setWallet] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setP(null)
    supabase
      .from('products')
      .select('*')
      .eq('mc_id', Number(productId))
      .single()
      .then(({ data }) => {
        if (!data || data.is_hidden) setNotFound(true)
        else {
          setP(data)
          setQty(Number(data.min_qty) || 1)
        }
      })
  }, [productId])

  const unit = Number(p?.sell_unit_price) > 0 ? Number(p.sell_unit_price) : 0
  const ranged = Number(p?.max_qty) > 0
  const total = useMemo(() => (unit ? round100(unit * (ranged ? Number(qty) || 0 : 1)) : 0), [unit, qty, ranged])
  const available = p?.is_available && unit > 0

  if (notFound) return <div className="container-app"><div className="card p-8 text-center text-sm font-black text-ink">المنتج غير موجود</div></div>
  if (!p) return <div className="container-app"><div className="skeleton h-96" /></div>

  async function submit(e) {
    e.preventDefault()
    if (!available) return
    if (!idUser.trim() || idUser.trim().length < 3) return toast.error('أدخل رقم الحساب / اللاعب بشكل صحيح')
    if (ranged && (!Number(qty) || Number(qty) <= 0)) return toast.error('أدخل الكمية المطلوبة')
    setSubmitting(true)
    try {
      const { code } = await api.createOrder({
        product_mc_id: p.mc_id,
        id_user: idUser.trim(),
        amount: ranged ? Number(qty) : 1,
        customer_wallet: wallet.trim(),
      })
      navigate('/pay/' + code)
    } catch (e2) {
      toast.error(e2.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-app max-w-2xl space-y-5">
      <button onClick={() => history.back()} className="btn-ghost !px-2 text-xs font-black">
        <ChevronLeft className="h-4 w-4 rotate-180" /> رجوع
      </button>

      <div className="card overflow-hidden">
        <div className="grid h-44 place-items-center bg-chip">
          {p.img ? <img src={p.img} alt={p.name} className="h-full w-full object-cover" /> : <ImageOff className="h-14 w-14 text-plum/25" />}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-black leading-snug text-ink">{p.name}</h1>
              <p className="mt-0.5 text-[11px] font-bold text-smoke">{p.department_name}{p.top_category_name ? ' • ' + p.top_category_name : ''}</p>
            </div>
            {available ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint/10 px-3 py-1 text-[10px] font-black text-emerald-600">
                <Zap className="h-3 w-3" /> متوفر
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose/10 px-3 py-1 text-[10px] font-black text-rose">غير متوفر</span>
            )}
          </div>
          {p.info && <p className="rounded-2xl bg-chip/70 p-3 text-[11px] font-bold leading-6 text-smoke"><Clock className="ml-1 inline h-3.5 w-3.5 text-plum" /> {p.info}</p>}
          <div className="flex flex-wrap gap-2 text-[10px] font-black">
            {p.can_check && <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-plum"><ShieldCheck className="h-3 w-3" /> تحقق تلقائي من الحساب</span>}
            {ranged && <span className="rounded-full bg-chip px-2.5 py-1 text-plum">الكمية: {p.min_qty} — {p.max_qty}</span>}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <h2 className="text-sm font-black text-ink">بيانات الطلب</h2>

        <div>
          <label className="field-label">{p.label_player_id || p.label_name || 'رقم الحساب / اللاعب / الهاتف'} *</label>
          <input value={idUser} onChange={(e) => setIdUser(e.target.value)} placeholder="أدخل الرقم بدقة قبل المتابعة" className="field tracking-wide" inputMode="text" />
        </div>

        {ranged && (
          <div>
            <label className="field-label">الكمية المطلوبة *</label>
            <input type="number" value={qty || ''} min={p.min_qty} max={p.max_qty} onChange={(e) => setQty(e.target.value)} className="field" />
            <div className="mt-1.5 flex justify-between text-[10px] font-bold text-smoke">
              <span>الأدنى {p.min_qty}</span><span>الأقصى {p.max_qty}</span>
            </div>
          </div>
        )}

        <div>
          <label className="field-label">رقم محفظة شام كاش (للإرجاع عند الحاجة) — اختياري</label>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="09xxxxxxxx" className="field" inputMode="tel" />
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-chip/70 px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs font-black text-ink"><Wallet className="h-4 w-4 text-plum" /> الإجمالي</span>
          <span className="text-lg font-black text-plum">{total ? fmtSYP(total) : '—'}</span>
        </div>

        <button type="submit" disabled={!available || submitting} className="btn-gradient w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'متابعة الدفع عبر شام كاش'}
        </button>
        <p className="text-center text-[10px] font-bold leading-5 text-smoke">
          بعد المتابعة ستحصل على رقم طلب ومبلغ دقيق تحوّله عبر شام كاش — ثم يبدأ الشحن تلقائياً بعد تأكيد الإدارة
        </p>
      </form>
    </div>
  )
}
