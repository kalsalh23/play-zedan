// Check what products /departments/{id} returns vs what's already in DB (find missing packages/subscriptions)
import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY }
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()

const deps = await (await fetch(SB + '/rest/v1/departments?select=mc_id,name,top_id,top_name', { headers: HS })).json()
out.push('departments: ' + deps.length)

const existing = new Set((await (await fetch(SB + '/rest/v1/products?select=mc_id', { headers: HS })).json()).map((r) => r.mc_id))
out.push('existing products: ' + existing.size)

const seen = new Map()
let totalApi = 0
for (const d of deps) {
  try {
    const r = await fetch(B + '/departments/' + d.mc_id, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })
    if (!r.ok) { out.push('dep fail ' + d.name + ': ' + r.status); continue }
    const prods = (await r.json())?.data?.products || []
    totalApi += prods.length
    for (const p of prods) if (!existing.has(p.id) && !seen.has(p.id)) seen.set(p.id, { ...p, _dep: d })
  } catch (e) { out.push('dep err ' + d.name + ': ' + e.message) }
  await new Promise((r) => setTimeout(r, 120))
}
out.push('total product rows across departments: ' + totalApi)
out.push('NEW products not in DB: ' + seen.size)
const arr = [...seen.values()]
out.push('samples: ' + JSON.stringify(arr.slice(0, 6).map((p) => ({ id: p.id, name: p.name, unit: p.unit_price, dep: p._dep.name, min: p.min_qty, max: p.max_qty })), null, 1).slice(0, 900))
writeFileSync('missing-deps.txt', out.join('\n'))
