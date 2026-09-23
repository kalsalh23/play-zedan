import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const B = 'https://app.market-card99.com/api/v2'
const EMAIL = 'kosaialsalh1@gmail.com'
const PASS = 'Oday2001#'

async function login() {
  for (const [label, bodyObj] of [
    ['email field', { email: EMAIL, password: PASS }],
    ['username field', { username: EMAIL, password: PASS }],
  ]) {
    const body = new URLSearchParams(bodyObj)
    const r = await fetch(B + '/login', { method: 'POST', headers: { Accept: 'application/json' }, body })
    const t = await r.text()
    let j = null
    try { j = JSON.parse(t) } catch {}
    const tk = j?.token || j?.data?.token || null
    out.push(label + ' -> ' + r.status + ' ' + (tk ? 'TOKEN OK' : t.slice(0, 130).replace(/\s+/g, ' ')))
    if (tk) return tk
  }
  return null
}
const token = await login()
out.push('TOKEN: ' + (token ? 'OK' : 'NONE'))
if (token) {
  const pf = await fetch(B + '/profiles', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } })
  const pj = await pf.json().catch(() => null)
  out.push('profile: ' + JSON.stringify({ name: pj?.data?.user?.name, email: pj?.data?.user?.email, username: pj?.data?.user?.username, group: pj?.data?.user?.group?.name, balance: pj?.data?.user?.balance }))

  // priced products
  const pr = await fetch(B + '/products', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } })
  const prods = (await pr.json())?.data?.products || []
  const priced = prods.filter((p) => Number(p.unit_price) > 0 || Number(p.price) > 0)
  out.push('products: ' + prods.length + ' | priced: ' + priced.length)

  // settings for pricing
  const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
  const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
  const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
  const setRes = await fetch(SB + '/rest/v1/settings?select=key,value', { headers: HS })
  const settings = Object.fromEntries((await setRes.json()).map((r) => [r.key, r.value]))
  const rate = Number(settings.usd_rate || 15000)
  const markup = Number(settings.markup_percent || 12)
  const sell = (usd) => Math.ceil((Number(usd) * rate * (1 + markup / 100)) / 100) * 100

  // patch sell prices + availability
  const priceMap = new Map(prods.map((p) => [p.id, Number(p.unit_price) > 0 ? Number(p.unit_price) : Number(p.price) || 0]))
  const all = await (await fetch(SB + '/rest/v1/products?select=mc_id,unit_price', { headers: HS })).json()
  let patched = 0
  for (let i = 0; i < all.length; i += 100) {
    const rows = all.slice(i, i + 100).map((p) => {
      const unit = priceMap.has(p.mc_id) ? priceMap.get(p.mc_id) : Number(p.unit_price) || 0
      return { mc_id: p.mc_id, sell_unit_price: unit > 0 ? sell(unit) : 0, is_available: priceMap.has(p.mc_id) ? !!(prods.find((x) => x.id === p.mc_id)?.is_available) && unit > 0 : undefined }
    })
    const r = await fetch(SB + '/rest/v1/products?columns=mc_id,sell_unit_price,is_available', {
      method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows),
    })
    if (r.ok) patched += rows.length
    else out.push('patch fail @' + i + ': ' + r.status)
  }
  out.push('sell prices patched: ' + patched)

  // save credentials
  const up = await fetch(SB + '/rest/v1/settings?on_conflict=key', {
    method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([
      { key: 'mc_username', value: EMAIL },
      { key: 'mc_password', value: PASS },
    ]),
  })
  out.push('credentials saved: ' + up.status)

  // sample
  const sample = prods.filter((p) => Number(p.unit_price) > 0).slice(0, 3)
  out.push('samples: ' + JSON.stringify(sample.map((p) => p.name + ' | $' + p.unit_price + ' -> ' + sell(p.unit_price) + ' SYP')))
  writeFileSync('.mc-owner-token.txt', token)
}
writeFileSync('tier2-out.txt', out.join('\n'))
