// POST /api/admin-sync — sync products from Market-Card into Supabase (or seed demo catalog)
import { requireAdmin, mcSyncProducts, getSettings, recalcSellPrices, seedDemoCatalog, log, ok, fail } from './_lib.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const s = await requireAdmin(req)
    if (s.mc_demo === 'true' && !s.mc_username) {
      const seeded = await seedDemoCatalog(s)
      const msg = `الوضع التجريبي: زُرع كتالوج عرض (${seeded} منتجاً) — أدخل بيانات Market-Card في الإعدادات للمزامنة الحقيقية`
      await log('sync', msg)
      return ok(res, { message: msg, demo: true })
    }
    const r = await mcSyncProducts(s)
    const rec = await recalcSellPrices(s)
    const msg = `تمت مزامنة ${r.products} منتجاً و ${r.departments} قسماً — حُدّثت أسعار البيع (${rec.count} منتجاً)`
    await log('sync', msg, r)
    return ok(res, { message: msg, ...r })
  } catch (e) {
    await log('sync', 'فشل المزامنة: ' + e.message)
    return fail(res, e)
  }
}
