import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MCImageCard, { MCGrid } from '../components/MCImageCard'

export default function Categories() {
  const [cats, setCats] = useState(null)
  useEffect(() => {
    supabase.from('categories').select('mc_id,name,img').order('sort').then(({ data }) => setCats(data || []))
  }, [])

  return (
    <div className="container-app space-y-5">
      <div>
        <h1 className="text-xl font-black text-ink">جميع الأقسام</h1>
        <p className="text-xs font-bold text-smoke">اختر القسم ثم الفئة التي تناسبك</p>
      </div>

      {!cats ? (
        <MCGrid>{[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</MCGrid>
      ) : cats.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-black text-ink">لا توجد أقسام منشورة بعد</p>
          <p className="mt-1 text-xs font-bold text-smoke">تُزامن الأقسام من لوحة الإدارة</p>
        </div>
      ) : (
        <MCGrid>
          {cats.map((c) => (
            <MCImageCard key={c.mc_id} to={`/c/${c.mc_id}`} img={c.img} name={c.name} />
          ))}
        </MCGrid>
      )}
    </div>
  )
}
