import { Link } from 'react-router-dom'

// Market-card style image card: image tile + name below (+ optional price)
// 2 per row on mobile, up to 6 per row on desktop — matches col-6 / col-md-2 grid.
export default function MCImageCard({ to, img, name, ribbon, price, disabled, onClick }) {
  const inner = (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-chip bg-white shadow-[0_3px_14px_rgba(74,31,82,0.07)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_24px_rgba(74,31,82,0.14)] aspect-square">
        {img ? (
          <img
            src={img}
            loading="lazy"
            alt={name}
            className={'h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105' + (disabled ? ' opacity-40 grayscale' : '')}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl font-black text-plum/15">؟</div>
        )}
        {ribbon && (
          <span className="absolute right-2 top-2 rounded-full bg-rose px-2.5 py-0.5 text-[9px] font-black text-white shadow">{ribbon}</span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-center text-[12px] font-extrabold leading-4 text-ink">{name}</p>
      {price !== undefined && price !== null && (
        <p className="text-center text-[11px] font-black text-plum">{price}</p>
      )}
    </>
  )
  if (onClick && !disabled) {
    return (
      <button onClick={onClick} className="group block w-full text-center">
        {inner}
      </button>
    )
  }
  if (!to || disabled) return <div className="group cursor-default">{inner}</div>
  return (
    <Link to={to} className="group block">
      {inner}
    </Link>
  )
}

export function MCGrid({ children }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{children}</div>
}
