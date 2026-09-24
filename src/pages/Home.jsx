import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck, Wallet, ChevronLeft, Gamepad2, Headphones, PackageSearch, ArrowLeft, BadgePercent, Search, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import MCImageCard, { MCGrid } from '../components/MCImageCard'
import ProductCard from '../components/ProductCard'

const STEPS = [
  { icon: Gamepad2, title: 'اختر المنتج', desc: 'تصفح الأقسام واختر ما يناسبك' },
  { icon: Wallet, title: 'حوّل عبر شام كاش', desc: 'حوّل المبلغ إلى رقم المحفظة المعروض' },
  { icon: Zap, title: 'استلم شحنك فوراً', desc: 'تأكيد من الإدارة وشحن تلقائي خلال دقائق' },
]

const DEFAULT_HERO = {
  hero_badge: 'عرض محدود 🔥',
  hero_title: 'خصومات حتى 20% على كل الأقسام',
  hero_subtitle: 'شحن ببجي، فري فاير، تطبيقات التواصل والبطاقات — بأسعار الجملة والدفع عبر شام كاش',
  hero_btn: 'تصفح العروض',
  hero_link: '/categories',
}

export default function Home() {
  const [cats, setCats] = useState(null)
  const [products, setProducts] = useState(null)
  const [hero, setHero] = useState(DEFAULT_HERO)
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('categories').select('mc_id,name,img').order('sort').then(({ data }) => setCats(data || []))
    supabase
      .from('products')
      .select('mc_id,name,img,is_available,sell_unit_price,max_qty,min_qty,department_name,top_category_name')
      .eq('is_hidden', false)
      .then(({ data }) => setProducts(data || []))
    api.storeConfig().then((r) => {
      const c = r.config || {}
      setHero({
        hero_badge: c.hero_badge || DEFAULT_HERO.hero_badge,
        hero_title: c.hero_title || DEFAULT_HERO.hero_title,
        hero_subtitle: c.hero_subtitle || DEFAULT_HERO.hero_subtitle,
        hero_btn: c.hero_btn || DEFAULT_HERO.hero_btn,
        hero_link: c.hero_link || DEFAULT_HERO.hero_link,
      })
    }).catch(() => {})
  }, [])

  const featured = useMemo(() => (products || []).filter((p) => p.is_available && Number(p.sell_unit_price) > 0).slice(0, 12), [products])

  return (
    <div className="container-app space-y-7">
      {/* Big rectangular offers hero */}
      <section className="hero-gradient relative overflow-hidden rounded-4xl p-6 text-white shadow-xl shadow-plum/25 sm:p-9">
        <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-gold/25 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-y-1/2 select-none text-[150px] font-black leading-none text-white/10 sm:block" aria-hidden>%</span>
        <Gamepad2 className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rotate-12 text-white/10" aria-hidden />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-black text-plum-dark shadow-lg shadow-gold/30">
            <Flame className="h-3.5 w-3.5" /> {hero.hero_badge}
          </span>
          <h1 className="mt-3 text-[26px] font-black leading-snug sm:text-3xl">{hero.hero_title}</h1>
          <p className="mt-2 text-xs font-bold leading-6 text-white/85 sm:text-sm">{hero.hero_subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link to={hero.hero_link || '/categories'} className="btn-gold !px-6">
              {hero.hero_btn} <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link to="/track" className="btn !bg-white/15 px-5 text-white backdrop-blur hover:!bg-white/25">
              <PackageSearch className="h-4 w-4" /> تتبع طلبك
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black text-white/75">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-gold" /> دفع آمن عبر شام كاش</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-gold" /> تنفيذ آلي فوري</span>
            <span className="flex items-center gap-1"><Headphones className="h-3 w-3 text-gold" /> دعم مباشر</span>
          </div>
        </div>
      </section>

      {/* Quick track */}
      <section>
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

