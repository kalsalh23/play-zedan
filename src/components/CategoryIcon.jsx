import { Gamepad2, Smartphone, MessageCircle, Signal, ShieldCheck, Users, Layers, CreditCard, Tv, Monitor, Hash, WalletCards } from 'lucide-react'
import { cn } from '../lib/utils'

export function categoryIcon(name) {
  const n = String(name || '')
  if (n.includes('ألعاب') || n.includes('بوبجي') || n.includes('فري')) return { icon: Gamepad2, cls: 'bg-indigo-100 text-indigo-600' }
  if (n.includes('تطبيقات')) return { icon: Smartphone, cls: 'bg-sky-100 text-sky-600' }
  if (n.includes('شات') || n.includes('تواصل') || n.includes('وتساب')) return { icon: MessageCircle, cls: 'bg-emerald-100 text-emerald-600' }
  if (n.includes('رصيد') || n.includes('اتصالات') || n.includes('اتصال') || n.includes('GSM') || n.includes('MTN') || n.includes('Syriatel')) return { icon: Signal, cls: 'bg-amber-100 text-amber-600' }
  if (n.includes('مكفولة') || n.includes('تفعيل')) return { icon: ShieldCheck, cls: 'bg-violet-100 text-violet-600' }
  if (n.includes('صفحات')) return { icon: Users, cls: 'bg-rose-100 text-rose-600' }
  if (n.includes('الدفع')) return { icon: CreditCard, cls: 'bg-teal-100 text-teal-600' }
  if (n.includes('اشتراك') || n.includes('إشتراك')) return { icon: Tv, cls: 'bg-fuchsia-100 text-fuchsia-600' }
  if (n.includes('WINDOWS') || n.includes('ويندوز')) return { icon: Monitor, cls: 'bg-cyan-100 text-cyan-600' }
  if (n.includes('أرقام') || n.includes('ارقام')) return { icon: Hash, cls: 'bg-orange-100 text-orange-600' }
  if (n.includes('بطاق') || n.includes('كروت')) return { icon: WalletCards, cls: 'bg-lime-100 text-lime-600' }
  return { icon: Layers, cls: 'bg-chip text-plum' }
}

export function HeroIconTile({ name, size = 'lg' }) {
  const { icon: Icon, cls } = categoryIcon(name)
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-2xl', cls, size === 'lg' ? 'h-12 w-12' : 'h-10 w-10')}>
      <Icon className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
    </span>
  )
}
