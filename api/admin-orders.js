// GET /api/admin-orders?status=&q= — list orders for admin
import { sb, requireAdmin, ok, fail } from './_lib.js'

export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    await requireAdmin(req)
    let q = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(300)
    const status = String(req.query.status || '').trim()
    const search = String(req.query.q || '').trim()
    if (status && status !== 'all') q = q.eq('status', status)
    if (search) q = q.or(`code.ilike.%${search}%,id_user.ilike.%${search}%,product_name.ilike.%${search}%`)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    // stats
    const { data: stats } = await sb.from('orders').select('status,sell_price,created_at')
    const today = new Date().toISOString().slice(0, 10)
    const by = { all: (stats || []).length, awaiting_payment: 0, paid: 0, processing: 0, completed: 0, cancelled: 0, refunded: 0, failed: 0 }
    let revenueToday = 0
    let revenueTotal = 0
    for (const o of stats || []) {
      by[o.status] = (by[o.status] || 0) + 1
      if (o.status === 'completed') {
        revenueTotal += Number(o.sell_price || 0)
        if (String(o.created_at).slice(0, 10) === today) revenueToday += Number(o.sell_price || 0)
      }
    }
    return ok(res, { orders: data || [], stats: { by, revenueToday, revenueTotal } })
  } catch (e) {
    return fail(res, e)
  }
}
