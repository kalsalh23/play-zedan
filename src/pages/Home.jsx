import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck, Wallet, ChevronLeft, Gamepad2, Headphones, PackageSearch, ArrowLeft, BadgePercent, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MCImageCard, { MCGrid } from '../components/MCImageCard'
import ProductCard from '../components/ProductCard'

const STEPS = [
  { icon: Gamepad2, title: 'اختر المنتج', desc: 'تصفح الأقسام واختر ما يناسبك' },
  { icon: Wallet, title: 'حوّل عبر شام كاش', desc: 'حوّل المبلغ إلى رقم المحفظة المعروض' },
  { icon: Zap, title: 'استلم شحنك فوراً', desc: 'تأكيد من الإدارة وشحن تلقائي خلال دقائق' },
]

export default function Home() {
  const [cats, setCats] = useState(null)
  const [products, setProducts] = useState(null)
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('categories').select('mc_id,name,img').order('sort').then(({ data }) => setCats(data || []))
    supabase
      .from('products')
      .select('mc_id,name,img,is_available,sell_unit_price,max_qty,min_qty,department_name,top_category_name')
      .eq('is_hidden', false)
      .then(({ data }) => setProducts(data || []))
  }, [])

  const featured = useMemo(() => (products || []).filter((p) => p.is_available && Number(p.sell_unit_price) > 0).slice(0, 12), [products])

  return (
    <div className="container-app space-y-7">
      {/* Welcome + quick track */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-ink">أهلاً بك في <span className="text-plum">MOBILY BRO+</span> 👋</h1>
            <p className="text-[11px] font-bold text-smoke">شحن الألعاب والتطبيقات وخدمات التواصل — دفع عبر شام كاش</p>
          </div>
          <ShieldCheck className="h-8 w-8 shrink-0 text-plum/15" />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate('/track?code=' + encodeURIComponent(code.trim())) }}
          className="card flex items-center gap-2 p-2.5"
        >
          <div className="relative flex-1">
            <PackageSearch className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="تتبع طلبك برقمه…"
              className="field !border-0 !bg-transparent !py-2 pr-10 tracking-widest"
            />
          </div>
          <button type="submit" className="btn-primary btn-sm shrink-0 !rounded-xl">
            <Search className="h-3.5 w-3.5" /> تتبع
          </button>
        </form>
      </section>

      {/* Slim offer banner */}
      <section>
        <Link to="/categories" className="card group flex items-center gap-3 border-r-4 border-gold p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-dark">
            <BadgePercent className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-ink">عروض وخصومات أسبوعية على كل الأقسام</p>
            <p className="truncate text-[10px] font-bold text-smoke">تابعنا لمعرفة خصم اليوم — التوصيل فوري خلال دقائق</p>
          </div>
          <ChevronLeft className="h-5 w-5 shrink-0 text-plum transition-transform group-hover:-translate-x-1" />
        </Link>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-black text-smoke">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-mint" /> دفع آمن</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-gold" /> تنفيذ آلي</span>
          <span className="flex items-center gap-1"><Headphones className="h-3 w-3 text-plum" /> دعم مباشر</span>
        </div>
      </section>

      {/* Sections — market-card style image grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-ink">الأقسام</h2>
          <Link to="/categories" className="flex items-center gap-1 text-[11px] font-black text-plum hover:underline">
            الكل <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
        {!cats ? (
          <MCGrid>{[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</MCGrid>
        ) : (
          <MCGrid>
            {cats.map((c) => (
              <MCImageCard key={c.mc_id} to={`/c/${c.mc_id}`} img={c.img} name={c.name} />
            ))}
          </MCGrid>
        )}
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">الأكثر طلباً</h2>
          </div>
          <MCGrid>
            {featured.map((p) => <ProductCard key={p.mc_id} p={p} />)}
          </MCGrid>
        </section>
      )}

      {/* How it works */}
      <section>
        <h2 className="mb-3 text-lg font-black text-ink">كيف تطلب؟</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="card relative overflow-hidden p-4">
              <span className="absolute -left-1 -top-2 text-4xl font-black text-chip">{i + 1}</span>
              <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-plum/10 text-plum">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-2.5 text-[13px] font-black text-ink">{s.title}</h3>
              <p className="relative mt-0.5 text-[11px] font-bold leading-5 text-smoke">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
