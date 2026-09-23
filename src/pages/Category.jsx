import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { HeroIconTile } from '../components/CategoryIcon'
import ProductCard from '../components/ProductCard'
import { cn } from '../lib/utils'

export default function Category() {
  const { topId } = useParams()
  const [params] = useSearchParams()
  const depParam = params.get('dep')
  const [products, setProducts] = useState(null)

  useEffect(() => {
    setProducts(null)
    supabase
      .from('products')
      .select('*')
      .eq('is_hidden', false)
      .eq('top_category_id', Number(topId))
      .then(({ data }) => setProducts(data || []))
  }, [topId])

  const deps = useMemo(() => {
    const m = new Map()
    for (const p of products || []) {
      if (!p.department_name) continue
      const d = m.get(p.department_id) || { id: p.department_id, name: p.department_name, count: 0 }
      d.count++
      m.set(p.department_id, d)
    }
    return [...m.values()].sort((a, b) => b.count - a.count)
  }, [products])

  const filtered = useMemo(() => {
    let list = products || []
    if (depParam) list = list.filter((p) => p.department_id === Number(depParam))
    return [...list].sort((a, b) => (b.is_available - a.is_available) || a.name.localeCompare(b.name, 'ar'))
  }, [products, depParam])

  const title = products?.[0]?.top_category_name || 'القسم'

  return (
    <div className="container-app space-y-5">
      <div className="flex items-center gap-3">
        <HeroIconTile name={title} size="md" />
        <div>
          <h1 className="text-xl font-black text-ink">{title}</h1>
          <p className="text-[11px] font-bold text-smoke">{filtered.length} خدمة متاحة للعرض</p>
        </div>
      </div>

      {deps.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button onClick={() => history.replaceState(null, '', `/c/${topId}`)} className={cn('chip', !depParam && 'chip-active')}>
            الكل
          </button>
          {deps.map((d) => (
            <button
              key={d.id}
              onClick={() => history.replaceState(null, '', `/c/${topId}?dep=${d.id}`)}
              className={cn('chip', Number(depParam) === d.id && 'chip-active')}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {!products ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-xs font-bold text-smoke">لا توجد خدمات في هذا القسم حالياً</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.mc_id} p={p} />)}
        </div>
      )}
    </div>
  )
}
