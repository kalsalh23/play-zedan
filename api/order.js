// POST /api/order — create a new order (public)
import { sb, getSettings, computeSell, genOrderCode, genUniquePayAmount, log, ok, fail, readBody, httpError } from './_lib.js'

export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const { product_mc_id, id_user, amount, customer_wallet, customer_note } = await readBody(req)
    if (!product_mc_id) throw httpError(400, 'المنتج غير محدد')
    if (!id_user || String(id_user).trim().length < 3) throw httpError(400, 'أدخل رقم الحساب / اللاعب بشكل صحيح')

    const s = await getSettings()
    const { data: p, error } = await sb.from('products').select('*').eq('mc_id', Number(product_mc_id)).single()
    if (error || !p) throw httpError(404, 'المنتج غير موجود')
    if (p.is_hidden) throw httpError(404, 'المنتج غير موجود')
    if (!p.is_available || Number(p.price) <= 0 && Number(p.unit_price) <= 0)
      throw httpError(400, 'هذا المنتج غير متوفر حالياً')

    let qty = 1
    if (Number(p.max_qty) > 0) {
      qty = Math.floor(Number(amount) || Number(p.min_qty) || 1)
      if (Number(p.min_qty) > 0 && qty < Number(p.min_qty))
        throw httpError(400, `أقل كمية مسموحة ${p.min_qty}`)
      if (qty > Number(p.max_qty)) throw httpError(400, `أعلى كمية مسموحة ${p.max_qty}`)
    }

    const unit = Number(p.unit_price) > 0 ? Number(p.unit_price) : Number(p.price)
    const sell = computeSell(unit, qty, s)
    if (!sell || sell <= 0) throw httpError(400, 'السعر غير معروف لهذا المنتج حالياً')
    const payAmount = await genUniquePayAmount(sell)

    const code = genOrderCode()
    const ins = {
      code,
      product_mc_id: p.mc_id,
      product_name: p.name,
      product_img: p.img || '',
      id_user: String(id_user).trim(),
      amount: qty,
      sell_price: sell,
      pay_amount: payAmount,
      customer_wallet: String(customer_wallet || '').trim(),
      customer_note: String(customer_note || '').trim(),
      status: 'awaiting_payment',
    }
    const { error: insErr } = await sb.from('orders').insert(ins)
    if (insErr) throw new Error('تعذر إنشاء الطلب: ' + insErr.message)
    await log('order', 'طلب جديد ' + code, { product: p.name, pay: payAmount })
    return ok(res, { code })
  } catch (e) {
    return fail(res, e)
  }
}
