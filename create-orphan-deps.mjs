// Create missing department cards for orphan product groups + generate branded placeholder images
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const PUBLIC_BASE = SB + '/storage/v1/object/public/branding/'

const tops = [...new Map((await (await fetch(SB + '/rest/v1/categories?select=mc_id,name', { headers: HS })).json()).map((c) => [c.mc_id, c.name])).entries()]
const topId = Object.fromEntries(tops)

const all = await (await fetch(SB + '/rest/v1/products?select=mc_id,department_id,department_name,top_category_id,top_category_name', { headers: HS })).json()
const deps = new Set((await (await fetch(SB + '/rest/v1/departments?select=mc_id', { headers: HS })).json()).map((d) => d.mc_id))
const topIds = new Set(tops.map(([id]) => Number(id)))

// group orphan products (department_id not in departments and not a top itself)
const groups = new Map()
for (const p of all) {
  const did = Number(p.department_id)
  if (deps.has(did) || topIds.has(did)) continue
  const g = groups.get(did) || { name: p.department_name, top_id: p.top_category_id, top_name: p.top_category_name, count: 0 }
  g.count++
  groups.set(did, g)
}
out.push('orphan groups: ' + groups.size + ' -> ' + [...groups.entries()].map(([id, g]) => id + ':' + g.name + '(' + g.count + ')').join(', '))

function cardSvg(name) {
  const esc = String(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return Buffer.from(`<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D3B75"/>
      <stop offset="0.6" stop-color="#4A1F52"/>
      <stop offset="1" stop-color="#38173F"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38173F"/>
      <stop offset="1" stop-color="#6D3B75"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <circle cx="90" cy="110" r="130" fill="#ffffff" opacity="0.06"/>
  <circle cx="520" cy="470" r="150" fill="#F2B01E" opacity="0.12"/>
  <text x="300" y="270" font-family="Arial" font-size="150" font-weight="900" fill="#F2B01E" text-anchor="middle" opacity="0.9">+</text>
  <text x="300" y="360" font-family="Arial" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">${esc}</text>
  <rect x="0" y="520" width="600" height="80" fill="url(#bar)"/>
  <text x="300" y="570" font-family="Arial" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">MOBILY <tspan fill="#F2B01E">BRO+</tspan></text>
</svg>`)
}

// ensure bucket
await fetch(SB + '/storage/v1/bucket', { method: 'POST', headers: HS, body: JSON.stringify({ name: 'branding', public: true }) })

let created = 0
for (const [did, g] of groups) {
  const img = PUBLIC_BASE + 'gen-' + did + '.webp'
  const webp = await sharp(cardSvg(g.name)).webp({ quality: 88 }).toBuffer()
  const up = await fetch(SB + '/storage/v1/object/branding/gen-' + did + '.webp', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
    body: webp,
  })
  if (!up.ok) { out.push('upload fail ' + did + ': ' + up.status); continue }
  const r = await fetch(SB + '/rest/v1/departments?columns=mc_id,name,img,sliders,top_id,top_name', {
    method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ mc_id: Number(did), name: g.name || 'فئة', img, sliders: [], top_id: g.top_id || 999999, top_name: g.top_name || 'خدمات أخرى' }]),
  })
  if (r.ok) created++
  else out.push('dep insert fail ' + did + ': ' + r.status + ' ' + (await r.text()).slice(0, 100))
}
out.push('departments created: ' + created)
const total = await (await fetch(SB + '/rest/v1/departments?select=mc_id', { headers: HS })).json()
out.push('TOTAL departments: ' + total.length)
writeFileSync('orphan-deps-out.txt', out.join('\n'))
