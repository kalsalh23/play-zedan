// Register owner credentials for the panel: admin_email + password hash (sha256 of Oday2001#)
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }

const EMAIL = 'kosaialsalh1@gmail.com'
const PASS = 'Oday2001#'
const hash = createHash('sha256').update(PASS).digest('hex')

const r = await fetch(SB + '/rest/v1/settings?on_conflict=key', {
  method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify([
    { key: 'admin_email', value: EMAIL },
    { key: 'admin_password_hash', value: hash },
  ]),
})
out.push('owner credentials saved: ' + r.status)

// verify via the live login API after deploy — local check of hash correctness here:
out.push('hash: ' + hash.slice(0, 12) + '...')
writeFileSync('owner-out.txt', out.join('\n'))
