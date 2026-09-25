import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY }
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()

// 1. my DB: all products with بوبجي/فري in name — their department ids
const prods = await (await fetch(SB + '/rest/v1/products?select=mc_id,name,department_id,department_name,top_category_name&name=ilike.*بوبجي*&limit=30', { headers: HS })).json()
out.push('DB بوبجي products: ' + prods.length)
const groups = new Map()
prods.forEach((p) => groups.set(p.department_id + '|' + p.department_name, (groups.get(p.department_id + '|' + p.department_name) || 0) + 1))
groups.forEach((v, k) => out.push('  dep ' + k + ' -> ' + v))

// 2. full /departments/3 response shape
const r = await fetch(B + '/departments/3', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })
const j = await r.json()
const data = j?.data || {}
out.push('/departments/3 keys: ' + Object.keys(data).join(','))
out.push('  categories: ' + JSON.stringify((data.categories || []).slice(0, 3).map((c) => ({ id: c.id, name: c.name }))))
out.push('  products: ' + (data.products || []).length)

// 3. if nested categories exist, probe one level deeper
if ((data.categories || []).length) {
  const sub = data.categories[0]
  const r2 = await fetch(B + '/departments/' + sub.id, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })
  const j2 = await r2.json()
  const d2 = j2?.data || {}
  out.push('/departments/' + sub.id + ' (' + sub.name + ') -> products: ' + (d2.products || []).length + ', categories: ' + (d2.categories || []).length)
  out.push('  sample: ' + JSON.stringify((d2.products || []).slice(0, 5).map((p) => ({ id: p.id, name: p.name, unit: p.unit_price }))))
  out.push('  category_id of those: ' + JSON.stringify([...new Set((d2.products || []).map((p) => p.category_id + ':' + p.category_name))]))
}
writeFileSync('deep-dep.txt', out.join('\n'))
