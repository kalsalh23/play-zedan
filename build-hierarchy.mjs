// Build 3-level hierarchy: for each department, find nested sub-departments via /categories/{id}, set parent_id
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()

async function jget(p, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(B + p, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 5000 + i * 4000)); continue }
    if (!r.ok) throw new Error(r.status)
    return r.json()
  }
  throw new Error('429')
}

// ensure parent_id column
await fetch('https://api.supabase.com/v1/projects/xwydphvmodofqghyhvxa/database/query', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'alter table public.departments add column if not exists parent_id bigint not null default 0;' }),
})

const deps = await (await fetch(SB + '/rest/v1/departments?select=mc_id,name', { headers: HS })).json()
const depIds = new Set(deps.map((d) => d.mc_id))
let links = 0
const pairs = []
for (const d of deps) {
  try {
    const data = (await jget('/categories/' + d.mc_id))?.data
    for (const c of data?.categories || []) {
      if (depIds.has(c.id)) { pairs.push({ mc_id: c.id, parent_id: d.mc_id, parent_name: d.name }); links++ }
    }
  } catch (e) { out.push('fail ' + d.name + ': ' + e.message) }
  await new Promise((r) => setTimeout(r, 700))
}
out.push('parent links found: ' + links)
out.push(JSON.stringify(pairs))

for (let i = 0; i < pairs.length; i += 50) {
  await fetch(SB + '/rest/v1/departments?columns=mc_id,parent_id', {
    method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(pairs.slice(i, i + 50)),
  })
}
out.push('parent_id saved')
writeFileSync('parent-out.txt', out.join('\n'))
