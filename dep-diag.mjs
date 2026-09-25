// Investigate: which departments lack products in DB vs API
import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY }
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()

const deps = await (await fetch(SB + '/rest/v1/departments?select=mc_id,name,top_id,top_name&order=mc_id.asc', { headers: HS })).json()
const prods = await (await fetch(SB + '/rest/v1/products?select=mc_id,name,department_id,department_name,is_available&limit=2000', { headers: HS })).json()

// find PUBG/PES/FIFA-like departments
const interesting = deps.filter((d) => /بوبجي|ببجي|بيس|PES|فيفا|FIFA|فري|فورتني|لودو/i.test(d.name))
out.push('interesting departments: ' + interesting.map((d) => d.mc_id + ':' + d.name).join(' | '))

for (const d of interesting.slice(0, 10)) {
  const mine = prods.filter((p) => p.department_id === d.mc_id)
  // API side
  let apiCount = '?', apiSample = []
  try {
    const r = await fetch(B + '/departments/' + d.mc_id, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })
    const j = await r.json()
    const ap = (j?.data?.products || [])
    apiCount = ap.length
    apiSample = ap.slice(0, 4).map((p) => p.name)
  } catch (e) { apiCount = 'ERR ' + e.message }
  out.push(`DEP ${d.mc_id} [${d.name}] top=${d.top_name} | DB: ${mine.length} products (${mine.slice(0, 3).map((p) => p.name).join(', ')}) | API: ${apiCount} (${apiSample.join(', ')})`)
}

// global stats: departments with 0 products in DB
const counts = new Map()
prods.forEach((p) => counts.set(p.department_id, (counts.get(p.department_id) || 0) + 1))
const empty = deps.filter((d) => !counts.get(d.mc_id))
out.push('\ndepartments with ZERO products in DB: ' + empty.length)
out.push(empty.map((d) => d.mc_id + ':' + d.name).join(' | '))
writeFileSync('dep-diag.txt', out.join('\n'))
