import { Gamepad2, Smartphone, MessageCircle, Signal, ShieldCheck, Users, Layers, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

export function categoryIcon(name) {
  const n = String(name || '')
  if (n.includes('ألعاب') || n.includes('بوبجي') || n.includes('فري')) return { icon: Gamepad2, cls: 'bg-indigo-100 text-indigo-600' }
  if (n.includes('تطبيقات')) return { icon: Smartphone, cls: 'bg-sky-100 text-sky-600' }
  if (n.includes('شات') || n.includes('تواصل')) return { icon: MessageCircle, cls: 'bg-emerald-100 text-emerald-600' }
  if (n.includes('رصيد') || n.includes('اتصالات') || n.includes('اتصال')) return { icon: Signal, cls: 'bg-amber-100 text-amber-600' }
  if (n.includes('مكفولة')) return { icon: ShieldCheck, cls: 'bg-violet-100 text-violet-600' }
  if (n.includes('صفحات')) return { icon: Users, cls: 'bg-rose-100 text-rose-600' }
  return { icon: Layers, cls: 'bg-chip text-plum' }
}

export function HeroIconTile({ name, size = 'lg' }) {
  const { icon: Icon, cls } = categoryIcon(name)
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-2xl', cls, size === 'lg' ? 'h-14 w-14' : 'h-10 w-10')}>
      <Icon className={size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'} />
    </span>
  )
}
