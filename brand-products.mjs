// Brand ALL product images: cover 1/3 with MOBILY BRO+ bar, upload to storage, patch DB
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const PUBLIC_BASE = SB + '/storage/v1/object/public/branding/'

function brandSvg(w, h, barH) {
  const y = h - barH
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38173F"/>
      <stop offset="0.5" stop-color="#4A1F52"/>
      <stop offset="1" stop-color="#6D3B75"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${y}" width="${w}" height="${barH}" fill="url(#g)"/>
  <rect x="0" y="${y}" width="${w}" height="4" fill="#F2B01E"/>
  <text x="${w / 2}" y="${y + barH / 2 + barH * 0.17}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.min(barH * 0.34, 40)}" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">MOBILY <tspan fill="#F2B01E">BRO+</tspan></text>
</svg>`)
}

const all = await (await fetch(SB + '/rest/v1/products?select=mc_id,img&img=neq.', { headers: HS })).json()
const todo = all.filter((p) => !p.img.includes('/branding/'))
out.push('products with images: ' + all.length + ' | to brand: ' + todo.length)

let ok = 0, fail = 0
const patches = []
for (const p of todo) {
  try {
    const buf = Buffer.from(await (await fetch(p.img)).arrayBuffer())
    const meta = await sharp(buf).metadata()
    const barH = Math.max(36, Math.round(meta.height / 3))
    const branded = await sharp(buf).composite([{ input: brandSvg(meta.width, meta.height, barH), top: 0, left: 0 }]).webp({ quality: 82 }).toBuffer()
    const up = await fetch(SB + '/storage/v1/object/branding/prod-' + p.mc_id + '-t3.webp', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
      body: branded,
    })
    if (!up.ok) throw new Error('up ' + up.status)
    patches.push({ mc_id: p.mc_id, img: PUBLIC_BASE + 'prod-' + p.mc_id + '-t3.webp' })
    ok++
  } catch (e) {
    fail++
    if (fail <= 8) out.push('fail ' + p.mc_id + ': ' + e.message)
  }
  if (patches.length >= 200) {
    await fetch(SB + '/rest/v1/products?columns=mc_id,img', { method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(patches) })
    patches.length = 0
    out.push('progress: ' + ok + ' branded, ' + fail + ' failed')
  }
  await new Promise((r) => setTimeout(r, 60))
}
if (patches.length) await fetch(SB + '/rest/v1/products?columns=mc_id,img', { method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(patches) })
out.push('DONE: branded=' + ok + ' failed=' + fail)
writeFileSync('prod-brand-out.txt', out.join('\n'))
