import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { HeroIconTile } from '../components/CategoryIcon'

export default function Categories() {
  const [products, setProducts] = useState(null)
  useEffect(() => {
    supabase
      .from('products')
      .select('top_category_id,top_category_name,department_id,department_name')
      .eq('is_hidden', false)
      .then(({ data }) => setProducts(data || []))
  }, [])

  const cats = useMemo(() => {
    const tops = new Map()
    for (const p of products || []) {
      if (!p.top_category_name) continue
      const t = tops.get(p.top_category_id) || { id: p.top_category_id, name: p.top_category_name, deps: new Map() }
      if (p.department_name) {
        const d = t.deps.get(p.department_id) || { id: p.department_id, name: p.department_name, count: 0 }
        d.count++
        t.deps.set(p.department_id, d)
      }
      tops.set(p.top_category_id, t)
    }
    return [...tops.values()].map((t) => ({ ...t, deps: [...t.deps.values()].sort((a, b) => b.count - a.count) }))
  }, [products])

  return (
    <div className="container-app space-y-6">
      <div>
        <h1 className="text-xl font-black text-ink">جميع الأقسام</h1>
        <p className="text-xs font-bold text-smoke">تصفح كل خدمات الشحن المتوفرة</p>
      </div>

      {!products ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40" />)}</div>
      ) : cats.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-black text-ink">لا توجد خدمات منشورة بعد</p>
          <p className="mt-1 text-xs font-bold text-smoke">يتم إضافة الخدمات بعد مزامنتها من لوحة الإدارة</p>
        </div>
      ) : (
        cats.map((t) => (
          <section key={t.id} className="card overflow-hidden">
            <Link to={`/c/${t.id}`} className="flex items-center justify-between bg-chip/60 px-5 py-3.5 transition-colors hover:bg-chip">
              <div className="flex items-center gap-3">
                <HeroIconTile name={t.name} size="md" />
                <h2 className="text-[15px] font-black text-ink">{t.name}</h2>
              </div>
              <ChevronLeft className="h-5 w-5 text-smoke" />
            </Link>
            <div className="flex flex-wrap gap-2 p-4">
              {t.deps.map((d) => (
                <Link key={d.id} to={`/c/${t.id}?dep=${d.id}`} className="chip hover:border-plum hover:text-plum">
                  {d.name} <span className="text-[9px] opacity-60">({d.count})</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
