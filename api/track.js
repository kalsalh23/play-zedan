// GET /api/track?code=MBXXXXXX — public order status (with lazy fulfillment-status sync)
import { sb, getSettings, getMcBill, ok, fail, httpError } from './_lib.js'

export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const code = String(req.query.code || '').trim().toUpperCase()
    if (!code) throw httpError(400, 'أدخل رقم الطلب')
    const { data: order, error } = await sb.from('orders').select('*').eq('code', code).single()
    if (error || !order) throw httpError(404, 'لم يتم العثور على طلب بهذا الرقم')

    try {
      await maybeProgress(order)
    } catch {}

    const { data: fresh } = await sb.from('orders').select('*').eq('code', code).single()
    const out = { ...(fresh || order) }
    // expose payment wallet info only while awaiting payment
    if (out.status === 'awaiting_payment') {
      const s = await getSettings()
      out.shamcash_number = s.shamcash_number || ''
      out.shamcash_name = s.shamcash_name || ''
    }
    // hide internal fields
    delete out.id
    delete out.mc_bill_id
    return ok(res, { order: out })
  } catch (e) {
    return fail(res, e)
  }
}

async function maybeProgress(order) {
  if (order.status !== 'processing') return
  const s = await getSettings()
  const demo = s.mc_demo === 'true'
  const now = new Date().toISOString()
  if (demo) {
    const waited = Date.now() - new Date(order.updated_at).getTime()
    if (waited > 10000) {
      const failSim = String(order.id_user).endsWith('0000')
      const patch = failSim
        ? { status: 'cancelled', cancel_note: 'فشل الشحن (محاكاة الوضع التجريبي) — تواصل مع الإدارة لإرجاع المبلغ', updated_at: now }
        : { status: 'completed', result_code: 'DEMO-' + order.code + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(), updated_at: now }
      await sb.from('orders').update(patch).eq('id', order.id)
    }
    return
  }
  if (order.mc_bill_id) {
    const j = await getMcBill(s, order.mc_bill_id)
    const bill = j?.data?.bill || j?.data || j?.bill
    if (bill) {
      const st = String(bill.status || '').toLowerCase()
      const patch = { mc_status: st, updated_at: now }
      if (['success', 'done', 'completed'].includes(st)) {
        patch.status = 'completed'
        patch.result_code = bill.data_id != null ? String(bill.data_id) : ''
      } else if (['cancel', 'cancelled', 'failed'].includes(st)) {
        patch.status = 'cancelled'
        patch.cancel_note = bill.cancel_note || 'ألغيت العملية لدى المزود'
      }
      if (patch.status !== order.status || patch.mc_status !== order.mc_status) {
        await sb.from('orders').update(patch).eq('id', order.id)
      }
    }
  }
}
