// GET /api/banners — public active banners for the hero slider
import { sb, ok, fail } from './_lib.js'

export const maxDuration = 15

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const { data, error } = await sb.from('banners').select('id,img,link,title').eq('active', true).order('sort')
    if (error) throw new Error(error.message)
    return ok(res, { banners: data || [] })
  } catch (e) {
    return fail(res, e)
  }
}
