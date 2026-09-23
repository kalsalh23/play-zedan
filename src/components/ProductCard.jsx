import { Link } from 'react-router-dom'
import { Zap, ShieldCheck, ImageOff } from 'lucide-react'
import { fmtSYP, round100 } from '../lib/utils'

export default function ProductCard({ p }) {
  const unit = Number(p.sell_unit_price) > 0 ? Number(p.sell_unit_price) : 0
  const ranged = Number(p.max_qty) > 0
  const from = unit ? fmtSYP(round100(unit * (Number(p.min_qty) || 1))) : ''
  const available = p.is_available && unit > 0
  return (
    <Link
      to={`/p/${p.mc_id}`}
      className="card group relative flex flex-col overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(74,31,82,0.16)]"
    >
      <div className="relative mb-2.5 grid h-28 w-full place-items-center overflow-hidden rounded-2xl bg-chip">
        {p.img ? (
          <img src={p.img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <ImageOff className="h-8 w-8 text-plum/25" />
        )}
        {available ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-mint/95 px-2 py-0.5 text-[9px] font-black text-white shadow">
            <Zap className="h-2.5 w-2.5" /> متوفر
          </span>
        ) : (
          <span className="absolute right-2 top-2 rounded-full bg-rose/95 px-2 py-0.5 text-[9px] font-black text-white shadow">غير متوفر</span>
        )}
        {p.can_check && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-black text-plum shadow">
            <ShieldCheck className="h-2.5 w-2.5" /> تحقق تلقائي
          </span>
        )}
      </div>
      <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-extrabold leading-5 text-ink">{p.name}</h3>
      <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-smoke">{p.department_name}</p>
      <div className="mt-2 flex items-center justify-between">
        {available ? (
          <span className="text-[13px] font-black text-plum">
            {ranged ? <span className="text-[10px] font-bold text-smoke">من </span> : ''}{from}
          </span>
        ) : (
          <span className="text-[11px] font-bold text-smoke">—</span>
        )}
        <span className="rounded-full bg-plum px-3 py-1 text-[10px] font-black text-white opacity-0 transition-opacity group-hover:opacity-100">اشترِ الآن</span>
      </div>
    </Link>
  )
}
