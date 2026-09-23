import { writeFileSync } from 'node:fs'
const out = []
const B = 'https://app.market-card99.com/api/v2/login'
const PASS = 'Oday2001#'
const tries = [
  ['username=kosaialsalh6', { username: 'kosaialsalh6', password: PASS }],
  ['email+username field email', { email: 'kosaialsalh6@gmail.com', password: PASS }],
  ['username=kosaialsalh6@gmail.com', { username: 'kosaialsalh6@gmail.com', password: PASS }],
]
let token = null
for (const [label, bodyObj] of tries) {
  const body = new URLSearchParams(bodyObj)
  const r = await fetch(B, { method: 'POST', headers: { Accept: 'application/json' }, body })
  const t = await r.text()
  let j = null
  try { j = JSON.parse(t) } catch {}
  const tk = j?.token || j?.data?.token || null
  out.push(label + ' -> ' + r.status + ' ' + (tk ? 'TOKEN OK' : t.slice(0, 120).replace(/\s+/g, ' ')))
  if (tk) { token = tk; break }
}
if (token) {
  const pf = await fetch('https://app.market-card99.com/api/v2/profiles', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } })
  const pj = await pf.json().catch(() => null)
  out.push('profile: ' + JSON.stringify({ name: pj?.data?.user?.name, email: pj?.data?.user?.email, group: pj?.data?.user?.group?.name, balance: pj?.data?.user?.balance }))
  writeFileSync('.mc-owner-token.txt', token)
}
writeFileSync('login2-out.txt', out.join('\n'))
