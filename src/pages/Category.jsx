import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import MCImageCard, { MCGrid } from '../components/MCImageCard'
import ProductCard from '../components/ProductCard'
import PackageSheet from '../components/PackageSheet'

export function Sliders({ sliders }) {
  if (!sliders || sliders.length === 0) return null
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-1">
      {sliders.map((s, i) => (
        <div key={i} className="w-full min-w-full snap-start px-0.5">
          <img
            src={s}
            loading="lazy"
            alt=""
            className="h-36 w-full rounded-2xl border border-chip object-cover shadow-sm sm:h-44"
          />
        </div>
      ))}
    </div>
  )
}

export default function Category() {
  const { topId } = useParams()
  const [cat, setCat] = useState(null)
  const [deps, setDeps] = useState(null)
  const [products, setProducts] = useState(null)
  const [sheet, setSheet] = useState(null)

  useEffect(() => {
    setCat(null); setDeps(null); setProducts(null); setSheetDep(null)
    supabase.from('categories').select('mc_id,name,img,sliders').eq('mc_id', Number(topId)).single().then(({ data }) => setCat(data))
    supabase.from('departments').select('mc_id,name,img,sliders,top_id').eq('top_id', Number(topId)).then(({ data }) => setDeps(data || []))
    supabase
      .from('products')
      .select('mc_id,name,img,is_available,sell_unit_price,max_qty,min_qty,department_id,department_name,top_category_id')
      .eq('is_hidden', false)
      .eq('top_category_id', Number(topId))
      .then(({ data }) => setProducts(data || []))
  }, [topId])

  const all = useMemo(
    () => [...(products || [])].sort((a, b) => b.is_available - a.is_available || a.name.localeCompare(b.name, 'ar')),
    [products]
  )

  return (
    <div className="container-app space-y-5">
      <div className="flex items-center gap-3">
        {cat?.img && (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-chip bg-white p-1">
            <img src={cat.img} alt={cat.name} className="h-full w-full object-contain" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-black text-ink">{cat?.name || '…'}</h1>
          <p className="text-[11px] font-bold text-smoke">{(deps?.length || 0) > 0 ? `${deps.length} فئة` : ''}{(products?.length || 0) > 0 ? `${deps?.length ? ' • ' : ''}${products.length} خدمة` : ''}</p>
        </div>
      </div>

      {cat && <Sliders sliders={cat.sliders} />}

      {deps && deps.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-black text-ink">الفئات</h2>
          <MCGrid>
            {deps.map((d) => (
              <MCImageCard
                key={d.mc_id}
                img={d.img}
                name={d.name}
                onClick={() => setSheet({ dep: d })}
              />
            ))}
          </MCGrid>
        </section>
      )}

      {all.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-black text-ink">الخدمات</h2>
          <MCGrid>
            {all.map((p) => (
              <ProductCard
                key={p.mc_id}
                p={p}
                onBuy={(prod) => setSheet({ dep: { mc_id: prod.department_id, name: prod.department_name, img: prod.img }, preselect: prod.mc_id })}
              />
            ))}
          </MCGrid>
        </section>
      )}

      {!cat && <MCGrid>{[...Array(6)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</MCGrid>}

      {cat && deps && deps.length === 0 && all.length === 0 && (
        <div className="card p-8 text-center text-xs font-bold text-smoke">لا توجد خدمات في هذا القسم حالياً</div>
      )}

      {sheet && <PackageSheet dep={sheet.dep} preselect={sheet.preselect} onClose={() => setSheet(null)} />}
    </div>
  )
}
