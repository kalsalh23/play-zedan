// Sync REAL tier prices using the owner's Market-Card account + save credentials in settings
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const B = 'https://app.market-card99.com/api/v2'

const EMAIL = 'kosaialsalh6@gmail.com'
const PASS = 'Oday2001#'

// 1. login (username field first, fallback email)
async function login() {
  for (const field of ['username', 'email']) {
    const body = new URLSearchParams({ [field]: EMAIL, password: PASS })
    const r = await fetch(B + '/login', { method: 'POST', headers: { Accept: 'application/json' }, body })
    const j = await r.json().catch(() => null)
    if (j?.token) { out.push('login ok via ' + field + ' | group: ' + JSON.stringify(j?.data?.user?.group_name || j?.user?.group_name || '?')); return j.token }
    out.push('login fail via ' + field + ': ' + JSON.stringify(j).slice(0, 150))
  }
  throw new Error('login failed')
}
const token = await login()

// 2. fetch priced products with owner's tier
const pr = await fetch(B + '/products', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } })
const prods = (await pr.json())?.data?.products || []
out.push('products: ' + prods.length)

// 3. current settings for pricing
const setRes = await fetch(SB + '/rest/v1/settings?select=key,value', { headers: HS })
const settings = Object.fromEntries((await setRes.json()).map((r) => [r.key, r.value]))
const rate = Number(settings.usd_rate || 15000)
const markup = Number(settings.markup_percent || 12)
const sell = (usd) => Math.ceil((Number(usd) * rate * (1 + markup / 100)) / 100) * 100

// 4. patch sell prices per product (real tier)
const priceMap = new Map(prods.map((p) => [p.id, Number(p.unit_price) > 0 ? Number(p.unit_price) : Number(p.price) || 0]))
const all = await (await fetch(SB + '/rest/v1/products?select=mc_id,unit_price,price', { headers: HS })).json()
let patched = 0
for (let i = 0; i < all.length; i += 100) {
  const rows = all.slice(i, i + 100).map((p) => {
    const unit = priceMap.has(p.mc_id) ? priceMap.get(p.mc_id) : Number(p.unit_price)
    return { mc_id: p.mc_id, sell_unit_price: unit > 0 ? sell(unit) : 0 }
  })
  const r = await fetch(SB + '/rest/v1/products?columns=mc_id,sell_unit_price', {
    method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows),
  })
  if (r.ok) patched += rows.length
  else out.push('patch chunk fail: ' + r.status + ' ' + (await r.text()).slice(0, 120))
}
out.push('sell prices patched: ' + patched)

// availability refresh from owner tier
const availRows = all.map((p) => {
  const src = prods.find((x) => x.id === p.mc_id)
  const unit = priceMap.get(p.mc_id) || 0
  return { mc_id: p.mc_id, is_available: !!src?.is_available && unit > 0 }
})
for (let i = 0; i < availRows.length; i += 100) {
  await fetch(SB + '/rest/v1/products?columns=mc_id,is_available', {
    method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(availRows.slice(i, i + 100)),
  })
}
out.push('availability refreshed')

// 5. save credentials in settings (mc_demo stays true — simulated fulfillment until flipped manually)
const up = await fetch(SB + '/rest/v1/settings?on_conflict=key', {
  method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify([
    { key: 'mc_username', value: EMAIL },
    { key: 'mc_password', value: PASS },
  ]),
})
out.push('settings saved: ' + up.status)

// sample comparison
const after = await (await fetch(SB + '/rest/v1/products?select=name,sell_unit_price,is_available&mc_id=in.(900001,1145)', { headers: HS })).json()
out.push('sample after: ' + JSON.stringify(after))
writeFileSync('tier-out.txt', out.join('\n'))
