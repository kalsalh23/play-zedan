// POST /api/admin-login — owner-only login (email + password, both required)
import { getSettings, sha256, issueToken, ok, fail, readBody, httpError } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    const { email, password } = await readBody(req)
    if (!email || !password) throw httpError(400, 'أدخل البريد الإلكتروني وكلمة المرور')
    const s = await getSettings()
    const hash = s.admin_password_hash || sha256('zedan-admin-2026')
    const emailOk = s.admin_email
      ? String(email).trim().toLowerCase() === s.admin_email.trim().toLowerCase()
      : true // legacy: no owner email configured yet
    const passOk = sha256(password) === hash
    if (!emailOk || !passOk) throw httpError(401, 'بيانات الدخول غير صحيحة')
    return ok(res, { token: issueToken(hash) })
  } catch (e) {
    return fail(res, e)
  }
}
