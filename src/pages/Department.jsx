import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Sliders } from './Category.jsx'
import MCImageCard, { MCGrid } from '../components/MCImageCard'
import ProductCard from '../components/ProductCard'

export default function Department() {
  const { depId } = useParams()
  const [dep, setDep] = useState(null)
  const [children, setChildren] = useState(null)
  const [products, setProducts] = useState(null)

  useEffect(() => {
    setDep(null); setChildren(null); setProducts(null)
    supabase.from('departments').select('mc_id,name,img,sliders,top_id,top_name').eq('mc_id', Number(depId)).single().then(({ data }) => setDep(data))
    supabase
      .from('departments')
      .select('mc_id,name,img')
      .eq('parent_id', Number(depId))
      .then(({ data }) => setChildren(data || []))
    supabase
      .from('products')
      .select('mc_id,name,img,is_available,sell_unit_price,max_qty,min_qty,department_id,department_name,top_category_id')
      .eq('is_hidden', false)
      .eq('department_id', Number(depId))
      .then(({ data }) => setProducts(data || []))
  }, [depId])

  const sorted = useMemo(() => [...(products || [])].sort((a, b) => b.is_available - a.is_available), [products])
  // hide own products if it has sub-departments (market-card hierarchy: browse through children)
  const hasChildren = !!children && children.length > 0

  return (
    <div className="container-app space-y-5">
      <div className="flex items-center gap-3">
        {dep?.img && (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-chip bg-white p-1">
            <img src={dep.img} alt={dep.name} className="h-full w-full object-contain" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-black text-ink">{dep?.name || '…'}</h1>
          <p className="text-[11px] font-bold text-smoke">{dep?.top_name ? dep.top_name + ' • ' : ''}{hasChildren ? (children.length + ' فئة') : products ? products.length + ' خدمة' : ''}</p>
        </div>
      </div>

      {dep && <Sliders sliders={dep.sliders} />}

      {hasChildren && (
        <section>
          <h2 className="mb-3 text-[15px] font-black text-ink">الفئات</h2>
          <MCGrid>
            {children.map((c) => (
              <MCImageCard key={c.mc_id} to={`/d/${c.mc_id}`} img={c.img} name={c.name} />
            ))}
          </MCGrid>
        </section>
      )}

      {!hasChildren && (!products ? (
        <MCGrid>{[...Array(6)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</MCGrid>
      ) : sorted.length === 0 ? (
        <div className="card p-8 text-center text-xs font-bold text-smoke">لا توجد خدمات في هذه الفئة حالياً</div>
      ) : (
        <MCGrid>
          {sorted.map((p) => <ProductCard key={p.mc_id} p={p} />)}
        </MCGrid>
      ))}
    </div>
  )
}
