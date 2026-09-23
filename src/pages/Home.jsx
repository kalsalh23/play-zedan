import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck, Wallet, ChevronLeft, Gamepad2, Smartphone, MessageCircle, Headphones, PackageSearch, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { HeroIconTile } from '../components/CategoryIcon'
import ProductCard from '../components/ProductCard'

const STEPS = [
  { icon: Gamepad2, title: 'اختر المنتج', desc: 'تصفح الأقسام واختر ما يناسبك' },
  { icon: Wallet, title: 'حوّل عبر شام كاش', desc: 'حوّل المبلغ إلى رقم المحفظة المعروض' },
  { icon: Zap, title: 'استلم شحنك فوراً', desc: 'تأكيد من الإدارة وشحن تلقائي خلال دقائق' },
]

export default function Home() {
  const [products, setProducts] = useState(null)
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('products')
      .select('mc_id,name,department_name,img,is_available,sell_unit_price,can_check,max_qty,min_qty,top_category_name,top_category_id')
      .eq('is_hidden', false)
      .then(({ data }) => setProducts(data || []))
  }, [])

  const cats = useMemo(() => {
    const map = new Map()
    for (const p of products || []) {
      if (!p.top_category_name) continue
      const c = map.get(p.top_category_id) || { id: p.top_category_id, name: p.top_category_name, count: 0 }
      c.count++
      map.set(p.top_category_id, c)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [products])

  const featured = useMemo(() => (products || []).filter((p) => p.is_available && Number(p.sell_unit_price) > 0).slice(0, 8), [products])

  return (
    <div className="container-app space-y-8">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden rounded-4xl p-6 text-white shadow-xl shadow-plum/25 sm:p-9">
        <Gamepad2 className="absolute -left-6 -top-6 h-36 w-36 rotate-12 text-white/10" />
        <Smartphone className="absolute -bottom-8 -right-4 h-28 w-28 -rotate-12 text-white/10" />
        <MessageCircle className="absolute left-16 bottom-6 h-10 w-10 text-gold/30" />
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black backdrop-blur">
            <Zap className="h-3 w-3 text-gold" /> شحن فوري خلال دقائق
          </span>
          <h1 className="mt-3 text-2xl font-black leading-snug sm:text-3xl">
            شحن ألعابك وتطبيقاتك
            <br />
            <span className="text-gold">بسرعة وأمان تام</span>
          </h1>
          <p className="mt-2 text-xs font-bold leading-6 text-white/80 sm:text-sm">
            الألعاب، تطبيقات الدردشة، خدمات التواصل والرصيد — كلها في مكان واحد، والدفع بسهولة عبر شام كاش.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link to="/categories" className="btn-gold !px-5 !py-2.5">
              تصفح الخدمات <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link to="/track" className="btn !bg-white/15 px-5 py-2.5 text-white backdrop-blur hover:!bg-white/25">
              <PackageSearch className="h-4 w-4" /> تتبع طلبك
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-black text-white/75">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> دفع موثوق</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-gold" /> تنفيذ آلي</span>
            <span className="flex items-center gap-1"><Headphones className="h-3.5 w-3.5 text-gold" /> دعم مباشر</span>
          </div>
        </div>
      </section>

      {/* Quick track */}
      <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="field-label !mb-1">تتبع طلبك برقمه</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="مثال: MBX7K2P"
            className="field !py-2.5 tracking-widest"
          />
        </div>
        <button
          onClick={() => code.trim() && navigate('/track?code=' + encodeURIComponent(code.trim()))}
          className="btn-primary !py-2.5 sm:self-end"
        >
          <PackageSearch className="h-4 w-4" /> تتبع
        </button>
      </section>

      {/* Categories */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-ink">الأقسام</h2>
          <Link to="/categories" className="flex items-center gap-1 text-[11px] font-black text-plum hover:underline">
            الكل <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
        {!products ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24" />)}
          </div>
        ) : cats.length === 0 ? (
          <div className="card p-6 text-center text-xs font-bold text-smoke">
            لم تُضف الخدمات بعد — تُزامن الأقسام من لوحة الإدارة
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cats.map((c) => (
              <Link key={c.id} to={`/c/${c.id}`} className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <HeroIconTile name={c.name} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black text-ink">{c.name}</p>
                  <p className="text-[10px] font-bold text-smoke">{c.count} خدمة</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">الأكثر طلباً</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.mc_id} p={p} />)}
          </div>
        </section>
      )}

      {/* How it works */}
      <section>
        <h2 className="mb-3 text-lg font-black text-ink">كيف تطلب؟</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="card relative overflow-hidden p-5">
              <span className="absolute -left-2 -top-3 text-5xl font-black text-chip">{i + 1}</span>
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-plum/10 text-plum">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-3 text-sm font-black text-ink">{s.title}</h3>
              <p className="relative mt-1 text-[11px] font-bold leading-5 text-smoke">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
