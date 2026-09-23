// POST /api/admin-login — verify admin password, return token
import { getSettings, sha256, issueToken, ok, fail, readBody, httpError } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const { password } = await readBody(req)
    if (!password) throw httpError(400, 'أدخل كلمة المرور')
    const s = await getSettings()
    const hash = s.admin_password_hash || sha256('zedan-admin-2026')
    if (sha256(password) !== hash) throw httpError(401, 'كلمة المرور غير صحيحة')
    return ok(res, { token: issueToken(hash) })
  } catch (e) {
    return fail(res, e)
  }
}
