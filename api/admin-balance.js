// GET /api/admin-balance — Market-Card profile + balance ledger (or demo data)
import { getSettings, mcGet, requireAdmin, ok, fail } from './_lib.js'

export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    await requireAdmin(req)
    const s = await getSettings()
    if (s.mc_demo === 'true' && !s.mc_username) {
      return ok(res, {
        demo: true,
        profile: { user: { name: 'وضع تجريبي', group: { name: 'DEMO' }, balance: '142.50' } },
        balances: [
          { id: 1, credit: '0.00', debit: '3.49', info: 'شراء منتج 340 بوبجي لايت', created_at: '2026-09-23', total: '142.50' },
          { id: 2, credit: '25.00', debit: '0.00', info: 'إيداع رصيد', created_at: '2026-09-20', total: '145.99' },
        ],
      })
    }
    const [profile, balances] = await Promise.all([mcGet(s, '/profiles'), mcGet(s, '/balances')])
    return ok(res, { profile: profile?.data || {}, balances: balances?.data || {} })
  } catch (e) {
    return fail(res, e)
  }
}
