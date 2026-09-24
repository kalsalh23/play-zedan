// Full per-department product harvest (429-aware) + upsert ALL missing products with USD pricing
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()

const jget = async (p, tries = 5) => {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(B + p, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })
    if (r.status === 429) {
      await new Promise((res) => setTimeout(res, 5000 + i * 4000))
      continue
    }
    if (!r.ok) throw new Error(r.status)
    return r.json()
  }
  throw new Error('429 exhausted')
}

// settings
const setRes = await fetch(SB + '/rest/v1/settings?select=key,value', { headers: HS })
const settings = Object.fromEntries((await setRes.json()).map((r) => [r.key, r.value]))
const markup = Number(settings.markup_percent || 12)
const sell = (usd) => Math.round(Number(usd) * (1 + markup / 100) * 100) / 100

const deps = await (await fetch(SB + '/rest/v1/departments?select=mc_id,name,top_id,top_name', { headers: HS })).json()
const existing = new Map((await (await fetch(SB + '/rest/v1/products?select=mc_id,unit_price', { headers: HS })).json()).map((r) => [r.mc_id, r.unit_price]))
out.push('departments: ' + deps.length + ' | existing: ' + existing.size)

const fresh = new Map()
let rows = 0
for (const d of deps) {
  try {
    const prods = (await jget('/departments/' + d.mc_id))?.data?.products || []
    rows += prods.length
    for (const p of prods) if (!existing.has(p.id)) fresh.set(p.id, { ...p, _dep: d })
  } catch (e) { out.push('DEP FAILED: ' + d.name + ' (' + e.message + ')') }
  await new Promise((r) => setTimeout(r, 900))
}
out.push('rows seen: ' + rows + ' | new products: ' + fresh.size)

const arr = [...fresh.values()].map((p) => {
  const unit = Number(p.unit_price) > 0 ? Number(p.unit_price) : Number(p.price) || 0
  return {
    mc_id: p.id,
    name: p.name || '',
    type: p.type || 'id',
    info: p.info || '',
    img: p.img || '',
    min_qty: p.min_qty || 0,
    max_qty: p.max_qty || 0,
    is_available: !!p.is_available && unit > 0,
    price: p.price || 0,
    unit_price: p.unit_price || 0,
    sell_unit_price: unit > 0 ? sell(unit) : 0,
    can_check: !!p.can_check,
    is_url: !!p.is_url,
    department_id: p.category_id || p._dep.mc_id,
    department_name: p.category_name || p._dep.name,
    top_category_id: p._dep.top_id,
    top_category_name: p._dep.top_name,
    label_player_id: p.label_player_id || '',
    label_name: p.label_name || '',
  }
})

for (let i = 0; i < arr.length; i += 100) {
  const r = await fetch(SB + '/rest/v1/products?columns=mc_id,name,type,info,img,min_qty,max_qty,is_available,price,unit_price,sell_unit_price,can_check,is_url,department_id,department_name,top_category_id,top_category_name,label_player_id,label_name', {
    method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(arr.slice(i, i + 100)),
  })
  if (!r.ok) out.push('upsert chunk fail: ' + r.status + ' ' + (await r.text()).slice(0, 120))
}
out.push('upserted new: ' + arr.length)
const final = await (await fetch(SB + '/rest/v1/products?select=mc_id', { headers: HS })).json()
out.push('TOTAL products now: ' + final.length)
out.push('new samples: ' + JSON.stringify(arr.slice(0, 8).map((p) => p.name + ' ($' + p.sell_unit_price + ')')))
writeFileSync('harvest-out.txt', out.join('\n'))
