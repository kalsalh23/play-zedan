import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X, Zap, Loader2, ChevronLeft, ImageOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { fmtUSD, roundCents, cn } from '../lib/utils'

// Bottom-sheet package picker (market-card style list) for a department
export default function PackageSheet({ dep, onClose }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState(null)
  const [selected, setSelected] = useState(null)
  const [idUser, setIdUser] = useState('')
  const [qty, setQty] = useState('')
  const [wallet, setWallet] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setProducts(null)
    setSelected(null)
    // combine the department's own products + all its sub-departments' products
    supabase
      .from('departments')
      .select('mc_id,name')
      .eq('parent_id', Number(dep.mc_id))
      .then(async ({ data: kids }) => {
        const ids = [Number(dep.mc_id), ...((kids || []).map((k) => k.mc_id))]
        const { data } = await supabase
          .from('products')
          .select('mc_id,name,info,img,is_available,sell_unit_price,min_qty,max_qty,can_check,label_player_id,label_name,department_id,department_name')
          .eq('is_hidden', false)
          .in('department_id', ids)
        const list = (data || []).sort((a, b) => b.is_available - a.is_available)
        setProducts(list)
        const first = list.find((p) => p.is_available)
        if (first) {
          setSelected(first.mc_id)
          if (Number(first.min_qty) > 0) setQty(Number(first.min_qty))
        }
      })
  }, [dep.mc_id])

  const sel = useMemo(() => (products || []).find((p) => p.mc_id === selected) || null, [products, selected])
  // group products by sub-department when the sheet spans multiple (parent with children)
  const groups = useMemo(() => {
    if (!products || !products.length) return []
    const m = new Map()
    for (const p of products) {
      const k = p.department_name || dep.name
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(p)
    }
    return [...m.entries()].map(([name, list]) => ({ name, list: list.sort((a, b) => b.is_available - a.is_available) }))
  }, [products, dep.name])
  const ranged = sel ? Number(sel.max_qty) > 0 : false
  const total = useMemo(() => {
    if (!sel) return 0
    const q = ranged ? Number(qty) || 0 : 1
    return roundCents(Number(sel.sell_unit_price) * q)
  }, [sel, qty, ranged])

  function pick(p) {
    if (!p.is_available) return
    setSelected(p.mc_id)
    if (Number(p.min_qty) > 0) setQty(Number(p.min_qty))
    else setQty('')
  }

  async function buy() {
    if (!sel) return toast.error('اختر الباقة أولاً')
    if (!idUser.trim() || idUser.trim().length < 3) return toast.error('أدخل رقم الحساب / اللاعب بشكل صحيح')
    if (ranged && (!Number(qty) || Number(qty) < Number(sel.min_qty) || Number(qty) > Number(sel.max_qty)))
      return toast.error(`الكمية يجب أن تكون بين ${sel.min_qty} و ${sel.max_qty}`)
    setSubmitting(true)
    try {
      const { code } = await api.createOrder({
        product_mc_id: sel.mc_id,
        id_user: idUser.trim(),
        amount: ranged ? Number(qty) : 1,
        customer_wallet: wallet.trim(),
      })
      navigate('/pay/' + code)
    } catch (e) {
      toast.error(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-plum-dark/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[93vh] w-full flex-col overflow-hidden rounded-t-4xl bg-white shadow-2xl animate-slide-up sm:max-w-lg">
        {/* handle */}
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-12 rounded-full bg-chip" />
        </div>
        {/* header */}
        <div className="flex items-center gap-3 border-b border-chip px-4 py-3">
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-chip text-plum hover:bg-lilac-dark" aria-label="إغلاق">
            <X className="h-4.5 w-4.5 h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-left" dir="rtl">
            <p className="truncate text-[15px] font-black text-ink">{dep.name}</p>
            <p className="text-[10px] font-bold text-smoke">اختر الباقة</p>
          </div>
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-chip bg-chip p-0.5">
            {dep.img ? <img src={dep.img} alt="" className="h-full w-full object-contain" /> : <ImageOff className="m-auto h-5 w-5 text-plum/30" />}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div>
            <label className="field-label">{(sel && (sel.label_player_id || sel.label_name)) || 'رقم الحساب / اللاعب'} *</label>
            <input
              value={idUser}
              onChange={(e) => setIdUser(e.target.value)}
              placeholder="أدخل الرقم بدقة قبل الشراء"
              className="field tracking-wide"
            />
          </div>

          {ranged && sel && (
            <div>
              <label className="field-label">الكمية * (بين {sel.min_qty} و {sel.max_qty})</label>
              <input type="number" value={qty || ''} min={sel.min_qty} max={sel.max_qty} onChange={(e) => setQty(e.target.value)} className="field" />
            </div>
          )}

          <div>
            <label className="field-label">رقم محفظة شام كاش للإرجاع (اختياري)</label>
            <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="09xxxxxxxx" className="field" inputMode="tel" />
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] font-black text-smoke">الباقات المتوفرة</p>
            {!products ? (
              [...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)
            ) : products.length === 0 ? (
              <div className="rounded-2xl bg-chip/60 p-4 text-center text-xs font-bold text-smoke">لا توجد باقات في هذه الفئة حالياً</div>
            ) : (
              groups.map((g) => (
                <div key={g.name} className="space-y-2.5">
                  {groups.length > 1 && <p className="pt-1 text-[11px] font-black text-plum/70">— {g.name} —</p>}
                  {g.list.map((p) => {
                    const isSel = selected === p.mc_id
                    const unit = Number(p.sell_unit_price)
                    const pRanged = Number(p.max_qty) > 0
                    const price = unit > 0 ? fmtUSD(roundCents(unit * (pRanged ? Number(p.min_qty) || 1 : 1))) : null
                    return (
                      <button
                        key={p.mc_id}
                        onClick={() => pick(p)}
                        disabled={!p.is_available}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-right transition-all',
                          isSel ? 'border-plum bg-plum/5 shadow-md shadow-plum/10' : 'border-chip bg-chip/40 hover:border-plum/40',
                          !p.is_available && 'opacity-50'
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-extrabold text-ink">{p.name}</span>
                          {p.is_available ? (
                            <span className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[15px] font-black text-plum">{price || '—'}</span>
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-600">
                                <Zap className="h-2.5 w-2.5" /> فوري
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose">غير متوفر حالياً</span>
                          )}
                        </span>
                        <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors', isSel ? 'border-plum' : 'border-smoke/40')}>
                          {isSel && <span className="h-2.5 w-2.5 rounded-full bg-plum" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* sticky buy */}
        <div className="border-t border-chip bg-white p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-smoke">الإجمالي</span>
            <span className="text-lg font-black text-plum">{total ? fmtUSD(total) : '—'}</span>
          </div>
          <button onClick={buy} disabled={!sel || submitting} className="btn-gradient w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>شراء الآن <ChevronLeft className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
