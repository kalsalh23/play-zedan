// POST /api/admin-banners — add (base64 image) / delete hero ad banners
import sharp from 'sharp'
import { sb, requireAdmin, ok, fail, readBody, httpError } from './_lib.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    await requireAdmin(req)
    const { action, id, image_b64, link, title } = await readBody(req)

    if (action === 'add') {
      if (!image_b64) throw httpError(400, 'لم يُرفق ملف صورة')
      const raw = Buffer.from(String(image_b64).replace(/^data:[^;]+;base64,/, ''), 'base64')
      const webp = await sharp(raw).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
      const path = 'banner-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.webp'
      const up = await fetch(process.env.VITE_SUPABASE_URL + '/storage/v1/object/branding/' + path, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
        body: webp,
      })
      if (!up.ok) throw new Error('فشل رفع الصورة: ' + up.status)
      const img = process.env.VITE_SUPABASE_URL + '/storage/v1/object/public/branding/' + path
      const { data: last } = await sb.from('banners').select('sort').order('sort', { ascending: false }).limit(1)
      const { data: row, error } = await sb.from('banners').insert({ img, link: link || '/categories', title: title || '', sort: ((last && last[0] && last[0].sort) || 0) + 1 }).select().single()
      if (error) throw new Error(error.message)
      return ok(res, { message: 'أُضيف البانر', banner: row })
    }

    if (action === 'delete') {
      if (!id) throw httpError(400, 'معرف البانر مطلوب')
      const { data: row } = await sb.from('banners').select('img').eq('id', id).single()
      await sb.from('banners').delete().eq('id', id)
      if (row && row.img.includes('/branding/')) {
        const path = row.img.split('/branding/')[1]
        await fetch(process.env.VITE_SUPABASE_URL + '/storage/v1/object/branding/' + path, {
          method: 'DELETE', headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY },
        })
      }
      return ok(res, { message: 'حُذف البانر' })
    }

    if (action === 'toggle') {
      if (!id) throw httpError(400, 'معرف البانر مطلوب')
      const { data: row } = await sb.from('banners').select('active').eq('id', id).single()
      await sb.from('banners').update({ active: !(row && row.active) }).eq('id', id)
      return ok(res, { message: row && row.active ? 'أُخفي البانر' : 'فُعّل البانر' })
    }

    throw httpError(400, 'إجراء غير معروف')
  } catch (e) {
    return fail(res, e)
  }
}
