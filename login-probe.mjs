import { writeFileSync } from 'node:fs'
const out = []
const B1 = 'https://app.market-card99.com/api/v2/login'
const B2 = 'https://market-card99.com/api/v2/login'
const EMAIL = 'kosaialsalh6@gmail.com'
const PASS = 'Oday2001#'

async function tryLogin(url, kind) {
  try {
    let r
    if (kind === 'form') {
      const body = new URLSearchParams({ username: EMAIL, email: EMAIL, password: PASS })
      r = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body })
    } else {
      r = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASS }) })
    }
    const t = await r.text()
    out.push(`${url} [${kind}] -> ${r.status} ${t.slice(0, 220).replace(/\s+/g, ' ')}`)
    try { const j = JSON.parse(t); if (j.token || j.data?.token) return j.token || j.data.token } catch {}
  } catch (e) { out.push(`${url} [${kind}] ERR ${e.message}`) }
  return null
}

let token = await tryLogin(B1, 'form') || await tryLogin(B1, 'json') || await tryLogin(B2, 'form') || await tryLogin(B2, 'json')
out.push('TOKEN: ' + (token ? 'OK' : 'NONE'))
if (token) {
  const pf = await fetch('https://app.market-card99.com/api/v2/profiles', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } })
  const pj = await pf.json().catch(() => null)
  out.push('profile: ' + JSON.stringify({ name: pj?.data?.user?.name, group: pj?.data?.user?.group?.name, balance: pj?.data?.user?.balance }).slice(0, 300))
  writeFileSync('.mc-owner-token.txt', token)
}
writeFileSync('tier-out.txt', out.join('\n'))
