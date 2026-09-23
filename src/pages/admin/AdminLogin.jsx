import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Gamepad2, Loader2, LockKeyhole, ArrowRight } from 'lucide-react'
import { api, setAdminToken, getAdminToken } from '../../lib/api'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token } = await api.adminLogin(password)
      setAdminToken(token)
      toast.success('مرحباً أيمن 👋')
      navigate('/admin/dashboard')
    } catch (e2) {
      toast.error(e2.message)
    } finally {
      setLoading(false)
    }
  }

  if (getAdminToken()) {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <h1 className="text-lg font-black text-ink">أنت مسجل الدخول بالفعل</h1>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-primary mt-4 w-full">فتح لوحة التحكم</button>
          <Link to="/" className="btn-ghost mt-2 w-full text-xs">العودة للمتجر</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen place-items-center bg-lilac p-4">
      <form onSubmit={submit} className="card w-full max-w-sm animate-fade-up p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl hero-gradient text-white shadow-xl shadow-plum/30">
          <Gamepad2 className="h-8 w-8" />
        </div>
        <h1 className="text-lg font-black text-plum">لوحة إدارة MOBILY BRO+</h1>
        <p className="mt-1 text-[11px] font-bold text-smoke">الدخول مخصص لإدارة المتجر — أيمن زيدان</p>
        <div className="mt-6 text-right">
          <label className="field-label">كلمة المرور</label>
          <div className="relative">
            <LockKeyhole className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="field !pr-10"
              autoFocus
            />
          </div>
        </div>
        <button type="submit" disabled={loading || !password} className="btn-gradient mt-4 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'دخول'}
        </button>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-[11px] font-black text-smoke hover:text-plum">
          <ArrowRight className="h-3.5 w-3.5" /> العودة إلى المتجر
        </Link>
      </form>
    </div>
  )
}
