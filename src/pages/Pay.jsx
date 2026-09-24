import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Copy, Check, Smartphone, Wallet, BadgeCheck, PartyPopper, XCircle, Loader2, ImageOff } from 'lucide-react'
import { api } from '../lib/api'
import { fmtUSD, fmtDate, cn } from '../lib/utils'
import { StatusBadge, StatusTimeline } from '../components/Status'

function CopyRow({ label, value, big }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
        } catch {
          const ta = document.createElement('textarea')
          ta.value = value
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          ta.remove()
        }
        setCopied(true)
        toast.success('تم النسخ')
        setTimeout(() => setCopied(false), 1500)
      }}
      className={cn('group flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-right transition-colors', big ? 'border-gold/50 bg-gold-soft hover:border-gold' : 'border-chip bg-white hover:border-plum/40')}
    >
      <span className="min-w-0">
        <span className="block text-[10px] font-black text-smoke">{label}</span>
        <span className={cn('block truncate font-black text-plum', big ? 'text-xl tracking-wider' : 'text-base tracking-wide')} dir="ltr">{value}</span>
      </span>
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors', big ? 'bg-gold text-plum-dark' : 'bg-chip text-plum group-hover:bg-plum group-hover:text-white')}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </span>
    </button>
  )
}

export function OrderPanel({ order }) {
  const done = order.status === 'completed'
  const failed = ['cancelled', 'failed', 'refunded'].includes(order.status)
  const waiting = ['awaiting_payment'].includes(order.status)
  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-chip p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-chip">
            {order.product_img ? <img src={order.product_img} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-6 w-6 text-plum/25" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-ink">{order.product_name}</p>
            <p className="text-[10px] font-bold text-smoke">
              رقم الحساب: <span dir="ltr" className="font-black text-ink">{order.id_user}</span>
              {Number(order.amount) > 1 ? ' • الكمية: ' + order.amount : ''}
            </p>
            <p className="text-[10px] font-bold text-smoke">{fmtDate(order.created_at)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-2 divide-x divide-x-reverse divide-chip border-b border-chip text-center">
          <div className="p-3">
            <p className="text-[10px] font-black text-smoke">رقم الطلب</p>
            <p className="text-base font-black tracking-widest text-plum" dir="ltr">{order.code}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-black text-smoke">قيمة الطلب</p>
            <p className="text-base font-black text-plum">{fmtUSD(order.sell_price)}</p>
          </div>
        </div>

        <div className="p-5">
          <StatusTimeline status={order.status} />
        </div>
      </div>

      {waiting && (
        <div className="card space-y-3 p-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-ink"><Smartphone className="h-4 w-4 text-plum" /> خطوات الدفع عبر شام كاش</h3>
          <CopyRow big label="حوّل هذا المبلغ بالضبط (دولار)" value={String(order.pay_amount)} />
          <CopyRow label="إلى رقم محفظة شام كاش" value={order.shamcash_number || '— لم يُضبط رقم المحفظة بعد —'} />
          {order.shamcash_name && <CopyRow label="اسم صاحب المحفظة" value={order.shamcash_name} />}
          <ol className="space-y-1.5 rounded-2xl bg-chip/60 p-4 text-[11px] font-bold leading-6 text-ink">
            <li>1. افتح تطبيق شام كاش واختر "تحويل رصيد".</li>
            <li>2. أدخل رقم المحفظة أعلاه والمبلغ <b>بالضبط كما هو</b> (بدون تقريب).</li>
            <li>3. أكّد التحويل — سيبدأ الشحن تلقائياً بعد تأكيد الإدارة للمبلغ.</li>
            <li>4. أبقِ هذه الصفحة مفتوحة أو احفظ رقم الطلب للتتبع.</li>
          </ol>
        </div>
      )}

      {done && (
        <div className="card animate-fade-up space-y-3 border-2 border-mint/40 p-5 text-center">
          <span className="mx-auto grid h-14 w-14 animate-pop place-items-center rounded-full bg-mint text-white"><PartyPopper className="h-7 w-7" /></span>
          <h3 className="text-base font-black text-emerald-600">تم شحن طلبك بنجاح!</h3>
          {order.result_code && order.result_code !== 'null' && (
            <div className="mx-auto max-w-xs text-right"><CopyRow label="كود الشحن / المرجع" value={order.result_code} /></div>
          )}
          <p className="text-[11px] font-bold text-smoke">شكراً لثقتك بـ MOBILY BRO+</p>
        </div>
      )}

      {failed && (
        <div className="card space-y-2 border-2 border-rose/30 p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose text-white"><XCircle className="h-7 w-7" /></span>
          <h3 className="text-base font-black text-rose">{order.status === 'refunded' ? 'تم إرجاع المبلغ' : 'لم يكتمل الطلب'}</h3>
          {order.cancel_note && <p className="text-xs font-bold text-smoke">{order.cancel_note}</p>}
          {order.customer_wallet && order.status !== 'refunded' && (
            <p className="text-[11px] font-black text-ink">سيُعاد المبلغ إلى محفظتك: <span dir="ltr">{order.customer_wallet}</span></p>
          )}
        </div>
      )}

      {['paid', 'processing'].includes(order.status) && (
        <div className="card flex items-center gap-3 p-4 text-xs font-bold text-smoke">
          <Loader2 className="h-4 w-4 animate-spin text-plum" /> طلبك قيد التنفيذ الآن — هذه الصفحة تتحدث تلقائياً
        </div>
      )}

      <div className="text-center">
        <Link to="/track" className="text-[11px] font-black text-plum hover:underline">يمكنك تتبع الطلب لاحقاً برقمه من صفحة التتبع</Link>
      </div>
    </div>
  )
}

export default function Pay() {
  const { code } = useParams()
  const [order, setOrder] = useState(null)
  const [err, setErr] = useState('')
  const timer = useRef(null)

  useEffect(() => {
    let stop = false
    async function poll() {
      try {
        const { order: o } = await api.track(code)
        if (!stop) setOrder(o)
        setErr('')
        if (['awaiting_payment', 'paid', 'processing'].includes(o.status)) {
          timer.current = setTimeout(poll, 6000)
        }
      } catch (e) {
        if (!stop) setErr(e.message)
      }
    }
    poll()
    return () => { stop = true; clearTimeout(timer.current) }
  }, [code])

  if (err) return <div className="container-app max-w-lg"><div className="card p-8 text-center text-sm font-black text-rose">{err}</div></div>
  if (!order) return <div className="container-app max-w-lg space-y-4"><div className="skeleton h-40" /><div className="skeleton h-64" /></div>

  return (
    <div className="container-app max-w-lg">
      <OrderPanel order={order} />
    </div>
  )
}
