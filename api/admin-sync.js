// POST /api/admin-sync — sync products from Market-Card into Supabase (with owner-tier pricing)
import { requireAdmin, mcSyncProducts, getSettings, recalcSellPrices, log, ok, fail } from './_lib.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const s = await requireAdmin(req)
    if (!s.mc_username || !s.mc_password) {
      return ok(res, { message: 'أدخل بيانات حساب Market-Card في الإعدادات أولاً — الكتالوج الحالي محدّث بالفعل', demo: true })
    }
    const r = await mcSyncProducts(s)
    const rec = await recalcSellPrices(s)
    const msg = `تمت مزامنة ${r.products} منتجاً — حُدّثت أسعار البيع بفئة حسابك (${rec.count} منتجاً)`
    await log('sync', msg, r)
    return ok(res, { message: msg, ...r })
  } catch (e) {
    await log('sync', 'فشل المزامنة: ' + e.message)
    return fail(res, e)
  }
}
