import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY }
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()
const H = { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN }

// 1. try filtered /products
for (const q of ['?category_id=3', '?department_id=3', '?department=3', '?cat_id=3']) {
  try {
    const j = await (await fetch(B + '/products' + q, { headers: H })).json()
    const n = (j?.data?.products || []).length
    out.push('/products' + q + ' -> ' + n + (n ? ' | sample: ' + JSON.stringify((j.data.products || [])[0].name) : ''))
  } catch (e) { out.push('/products' + q + ' ERR ' + e.message) }
}

// 2. DB: فري فاير / FC / ball pool products
for (const q of ['فري فاير', 'free fire', 'FC', 'فيفا', 'ball pool', '8 ball']) {
  const rows = await (await fetch(SB + '/rest/v1/products?select=mc_id,name,department_name,department_id&name=ilike.*' + encodeURIComponent(q) + '*&limit=8', { headers: HS })).json()
  out.push('DB [' + q + ']: ' + rows.length + ' -> ' + rows.slice(0, 4).map((p) => p.name + ' (dep ' + p.department_id + ':' + p.department_name + ')').join(' • '))
}

// 3. global /products: which category_ids exist vs departments table
const all = (await (await fetch(B + '/products', { headers: H })).json())?.data?.products || []
const deps = await (await fetch(SB + '/rest/v1/departments?select=mc_id,name', { headers: HS })).json()
const depIds = new Set(deps.map((d) => d.mc_id))
const orphanCats = new Map()
for (const p of all) if (!depIds.has(p.category_id)) orphanCats.set(p.category_id + ':' + (p.category_name || '?'), (orphanCats.get(p.category_id + ':' + (p.category_name || '?')) || 0) + 1)
out.push('\nglobal products category_ids NOT in departments table:')
orphanCats.forEach((v, k) => out.push('  ' + k + ' -> ' + v))
writeFileSync('probe2-out.txt', out.join('\n'))
