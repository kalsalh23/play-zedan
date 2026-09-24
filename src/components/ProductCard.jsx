import MCImageCard from './MCImageCard'
import { fmtUSD, roundCents } from '../lib/utils'

// Product card in market-card style: image tile, name below, price under it.
export default function ProductCard({ p }) {
  const unit = Number(p.sell_unit_price) > 0 ? Number(p.sell_unit_price) : 0
  const ranged = Number(p.max_qty) > 0
  const available = p.is_available && unit > 0
  const from = unit ? fmtUSD(roundCents(unit * (Number(p.min_qty) || 1))) : null
  return (
    <MCImageCard
      to={`/p/${p.mc_id}`}
      img={p.img}
      name={p.name}
      ribbon={available ? null : 'غير متوفر'}
      disabled={!available}
      price={available ? (ranged ? <><span className="font-bold text-smoke">من </span>{from}</> : from) : null}
    />
  )
}
