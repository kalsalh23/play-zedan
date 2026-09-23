import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { api } from '../lib/api'
import { OrderPanel } from './Pay.jsx'

export default function Track() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(params.get('code') || '')
  const [order, setOrder] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const c = params.get('code')
    if (c) doTrack(c)
  }, [params])

  async function doTrack(c) {
    setLoading(true)
    setErr('')
    try {
      const { order: o } = await api.track(c)
      setOrder(o)
    } catch (e) {
      setOrder(null)
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-black text-ink">تتبع الطلب</h1>
        <p className="text-xs font-bold text-smoke">أدخل رقم الطلب الذي حصلت عليه عند الشراء (يبدأ بـ MB)</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate('/track?code=' + encodeURIComponent(code.trim().toUpperCase())) }}
        className="card flex gap-2 p-3"
      >
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MBX7K2P" className="field !py-2.5 tracking-widest" />
        <button type="submit" className="btn-primary shrink-0 !px-4 !py-2.5" disabled={loading}>
          <PackageSearch className="h-4 w-4" /> تتبع
        </button>
      </form>

      {err && <div className="card border-2 border-rose/30 p-5 text-center text-xs font-black text-rose">{err}</div>}
      {loading && !order && <div className="skeleton h-64" />}
      {order && <OrderPanel order={order} />}
    </div>
  )
}
