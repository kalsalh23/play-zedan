// GET/POST /api/admin-settings — read/update store settings
import { getSettings, upsertSettings, requireAdmin, sha256, issueToken, recalcSellPrices, ok, fail, readBody } from './_lib.js'

const EDITABLE = [
  'store_name', 'store_tagline', 'usd_rate', 'markup_percent',
  'shamcash_number', 'shamcash_name', 'mc_username', 'mc_password',
  'mc_purchase_password', 'mc_demo', 'install_banner',
  'hero_badge', 'hero_title', 'hero_subtitle', 'hero_btn', 'hero_link',
]

export const maxDuration = 30

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await requireAdmin(req)
      const s = await getSettings()
      const out = {}
      for (const k of EDITABLE) out[k] = s[k] ?? ''
      return ok(res, { settings: out })
    }
    if (req.method === 'POST') {
      const s = await requireAdmin(req)
      const body = await readBody(req)
      const patch = {}
      for (const k of EDITABLE) if (k in body) patch[k] = String(body[k] ?? '').trim()
      if ('admin_password' in body && body.admin_password) patch.admin_password_hash = sha256(body.admin_password)
      await upsertSettings(patch)
      // recompute sell prices when pricing inputs change
      if ('usd_rate' in patch || 'markup_percent' in patch) {
        try {
          const freshS = await getSettings()
          await recalcSellPrices(freshS)
        } catch {}
      }
      const fresh = await getSettings()
      const token = issueToken(fresh.admin_password_hash)
      return ok(res, { message: 'تم حفظ الإعدادات' + ('usd_rate' in patch || 'markup_percent' in patch ? ' وتحديث أسعار البيع' : ''), token })
    }
    return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  } catch (e) {
    return fail(res, e)
  }
}
