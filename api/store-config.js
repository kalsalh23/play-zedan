// GET /api/store-config — public, safe store configuration (hero banner content)
import { getSettings, ok, fail } from './_lib.js'

const PUBLIC_KEYS = ['hero_badge', 'hero_title', 'hero_subtitle', 'hero_btn', 'hero_link', 'store_name', 'store_tagline']

export const maxDuration = 15

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const s = await getSettings()
    const cfg = {}
    for (const k of PUBLIC_KEYS) cfg[k] = s[k] || ''
    return ok(res, { config: cfg })
  } catch (e) {
    return fail(res, e)
  }
}
