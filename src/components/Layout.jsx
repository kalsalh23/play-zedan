import { useEffect, useState } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Search, ShieldCheck, Gamepad2, Download, X, Share, PlusSquare } from 'lucide-react'
import { cn } from '../lib/utils'
import { initPWA, shouldAskInstall, markInstallAsked, promptInstall, isStandalone, isIOS } from '../pwa'

const NAV = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/categories', label: 'الأقسام', icon: LayoutGrid, end: false },
  { to: '/track', label: 'تتبع طلب', icon: Search, end: false },
  { to: '/admin', label: 'الإدارة', icon: ShieldCheck, end: false },
]

function Logo({ size = 'md' }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className={cn('relative grid place-items-center rounded-2xl hero-gradient text-white shadow-lg shadow-plum/30', size === 'md' ? 'h-11 w-11' : 'h-9 w-9')}>
        <Gamepad2 className="h-6 w-6" strokeWidth={2.2} />
        <span className="absolute -left-1.5 -top-1.5 grid h-4.5 w-4.5 h-5 w-5 place-items-center rounded-full bg-gold text-[11px] font-black text-plum-dark">+</span>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-black tracking-wide text-plum">MOBILY BRO+</span>
        <span className="block text-[10px] font-bold text-smoke">بإدارة أيمن زيدان</span>
      </span>
    </Link>
  )
}

function InstallModal({ onClose }) {
  const [phase, setPhase] = useState('ask') // ask | ios | done
  const ios = isIOS()
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-plum-dark/60 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-sm animate-fade-up p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="btn-ghost absolute left-3 top-3 !p-2" aria-label="إغلاق"><X className="h-4 w-4" /></button>
        <div className="mx-auto mb-3 grid h-16 w-16 animate-float place-items-center rounded-3xl hero-gradient text-white shadow-xl shadow-plum/30">
          <Gamepad2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-black text-plum">ثبّت تطبيق MOBILY BRO+</h3>
        <p className="mt-1 text-xs font-semibold text-smoke">وصول أسرع لكل خدمات الشحن، تجربة مستخدم مثل التطبيقات تماماً</p>
        <div className="mt-4 space-y-2 text-right">
          {ios ? (
            <div className="rounded-2xl bg-chip p-3 text-xs font-bold leading-6 text-ink">
              <Share className="ml-1 inline h-4 w-4 text-plum" /> اضغط زر المشاركة ثم
              <PlusSquare className="ml-1 inline h-4 w-4 text-plum" /> "إضافة إلى الشاشة الرئيسية"
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-smoke">التثبيت يستغرق ثانية واحدة ولا يستهلك مساحة تقريباً</p>
              <button
                onClick={async () => {
                  const out = await promptInstall()
                  if (out !== 'accepted') setPhase('done')
                  onClose()
                }}
                className="btn-gold w-full"
              >
                <Download className="h-4 w-4" /> تثبيت الآن
              </button>
            </>
          )}
          <button onClick={onClose} className="btn-ghost w-full text-xs">ليس الآن</button>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [showInstall, setShowInstall] = useState(false)
  const location = useLocation()

  useEffect(() => {
    initPWA(() => {})
    if (shouldAskInstall()) {
      const t = setTimeout(() => {
        setShowInstall(true)
        markInstallAsked()
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-lilac-dark/60 bg-lilac/85 backdrop-blur-md">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            {!isStandalone() && (
              <button onClick={() => setShowInstall(true)} className="btn-ghost !px-2.5" title="تثبيت التطبيق">
                <Download className="h-5 w-5" />
              </button>
            )}
            <Link to="/admin" className="flex h-10 w-10 items-center justify-center rounded-xl text-plum transition-colors hover:bg-chip" title="لوحة الإدارة" aria-label="لوحة الإدارة">
              <ShieldCheck className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 pt-4 md:pb-10">
        <Outlet />
      </main>

      <footer className="border-t border-lilac-dark/60 bg-white/60 py-6 text-center text-[11px] font-bold text-smoke">
        MOBILY BRO+ — بإدارة أيمن زيدان © {new Date().getFullYear()} — جميع الحقوق محفوظة
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-lilac-dark bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="التنقل السفلي">
        <div className="grid grid-cols-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors', isActive ? 'text-plum' : 'text-smoke')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('grid h-8 w-14 place-items-center rounded-full transition-colors', isActive && 'bg-plum/10')}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {showInstall && <InstallModal onClose={() => setShowInstall(false)} />}
    </div>
  )
}
