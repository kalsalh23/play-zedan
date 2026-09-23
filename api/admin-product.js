// POST /api/admin-product — toggle product visibility / price override
import { sb, requireAdmin, ok, fail, readBody, httpError } from './_lib.js'

export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    await requireAdmin(req)
    const body = await readBody(req)
    const { mc_id, is_hidden, price_override } = body
    if (!mc_id) throw httpError(400, 'معرف المنتج مطلوب')
    const patch = { updated_at: new Date().toISOString() }
    if ('is_hidden' in body) patch.is_hidden = !!is_hidden
    if ('price_override' in body) patch.price_override = price_override === null || price_override === '' ? null : Number(price_override)
    const { error } = await sb.from('products').update(patch).eq('mc_id', Number(mc_id))
    if (error) throw new Error(error.message)
    return ok(res, { message: 'تم التحديث' })
  } catch (e) {
    return fail(res, e)
  }
}
