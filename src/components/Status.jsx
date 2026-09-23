import { Clock, CheckCircle2, Loader2, CircleDollarSign, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export const STATUS_META = {
  awaiting_payment: { label: 'بانتظار الدفع', cls: 'bg-gold-soft text-gold-dark border-gold/40', dot: 'bg-gold' },
  paid: { label: 'تم الدفع', cls: 'bg-sky-50 text-sky-600 border-sky-200', dot: 'bg-sky-500' },
  processing: { label: 'جارٍ الشحن', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200', dot: 'bg-indigo-500' },
  completed: { label: 'تم الشحن بنجاح', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-mint' },
  cancelled: { label: 'ملغى', cls: 'bg-rose-50 text-rose-500 border-rose-200', dot: 'bg-rose' },
  failed: { label: 'فشل — قيد المعالجة', cls: 'bg-rose-50 text-rose-500 border-rose-200', dot: 'bg-rose' },
  refunded: { label: 'تم إرجاع المبلغ', cls: 'bg-chip text-plum border-lilac-dark', dot: 'bg-plum' },
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, cls: 'bg-chip text-smoke', dot: 'bg-smoke' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black', m.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

const STEPS = [
  { key: 'awaiting_payment', label: 'بانتظار الدفع', icon: CircleDollarSign },
  { key: 'paid', label: 'تم استلام الدفع', icon: CheckCircle2 },
  { key: 'processing', label: 'جارٍ الشحن لدى المزود', icon: Loader2 },
  { key: 'completed', label: 'تم التسليم', icon: CheckCircle2 },
]

export function StatusTimeline({ status }) {
  const failed = status === 'cancelled' || status === 'failed' || status === 'refunded'
  const reached = { awaiting_payment: 0, paid: 1, processing: 2, completed: 3 }
  const idx = reached[status] ?? (failed ? 1 : 0)
  return (
    <div className="relative space-y-0">
      {STEPS.map((s, i) => {
        const done = !failed && i < idx
        const active = !failed && i === idx
        const isFail = failed && i === 1
        return (
          <div key={s.key} className="relative flex gap-3 pb-6 last:pb-0">
            {i < STEPS.length - 1 && (
              <span className={cn('absolute right-[15px] top-8 h-[calc(100%-2rem)] w-0.5 rounded', done ? 'bg-mint' : 'bg-chip')} />
            )}
            <span
              className={cn(
                'z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 bg-white transition-colors',
                done && 'border-mint bg-mint text-white',
                active && !isFail && 'border-plum text-plum',
                isFail && 'border-rose bg-rose text-white',
                !done && !active && !isFail && 'border-chip text-smoke/40'
              )}
            >
              {isFail ? <XCircle className="h-4 w-4" /> : active ? <s.icon className={cn('h-4 w-4', s.key === 'processing' && 'animate-spin')} /> : <s.icon className="h-4 w-4" />}
            </span>
            <div className="pt-1">
              <p className={cn('text-[13px] font-extrabold', done || active || isFail ? 'text-ink' : 'text-smoke/60')}>
                {failed && i === 2 ? 'تم إيقاف الطلب' : s.label}
              </p>
              {failed && i === 2 && (
                <p className="text-[11px] font-bold text-rose">ستتواصل الإدارة معك بشأن إرجاع المبلغ</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
