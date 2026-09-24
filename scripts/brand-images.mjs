// Brand all category/department images + sliders: cover Market-Card strip with MOBILY BRO+ bar
// Square-ish images -> bottom bar ; wide banners -> top bar. Uploads to Supabase Storage 'branding'.
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const PUBLIC_BASE = SB + '/storage/v1/object/public/branding/'

// ensure bucket
await fetch(SB + '/storage/v1/bucket', { method: 'POST', headers: HS, body: JSON.stringify({ name: 'branding', public: true }) })

function brandSvg(w, h, barH, top) {
  const y = top ? 0 : h - barH
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38173F"/>
      <stop offset="0.5" stop-color="#4A1F52"/>
      <stop offset="1" stop-color="#6D3B75"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${y}" width="${w}" height="${barH}" fill="url(#g)"/>
  <rect x="0" y="${top ? barH : y}" width="${w}" height="3" fill="#F2B01E"/>
  <text x="${w / 2}" y="${y + barH / 2 + barH * 0.18}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.min(barH * 0.42, 34)}" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">MOBILY <tspan fill="#F2B01E">BRO+</tspan></text>
</svg>`)
}

const cache = new Map()
async function brand(url, key) {
  if (cache.has(url)) return cache.get(url)
  if (url.startsWith(PUBLIC_BASE)) { cache.set(url, url); return url } // already branded
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    const meta = await sharp(buf).metadata()
    const w = meta.width, h = meta.height
    const ratio = h / w
    const wide = ratio < 0.55 // banner slider
    const barH = Math.max(40, Math.min(Math.round(h * (wide ? 0.26 : 0.2)), 110))
    const branded = await sharp(buf)
      .composite([{ input: brandSvg(w, h, barH, wide), top: 0, left: 0 }])
      .webp({ quality: 84 })
      .toBuffer()
    const up = await fetch(SB + '/storage/v1/object/branding/' + key + '.webp', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
      body: branded,
    })
    if (!up.ok) throw new Error('upload ' + up.status + ' ' + (await up.text()).slice(0, 80))
    const publicUrl = PUBLIC_BASE + key + '.webp'
    cache.set(url, publicUrl)
    return publicUrl
  } catch (e) {
    out.push('brand fail [' + key + ']: ' + e.message)
    cache.set(url, url)
    return url
  }
}

async function patch(table, mc_id, patchBody) {
  const r = await fetch(SB + '/rest/v1/' + table + '?mc_id=eq.' + mc_id, { method: 'PATCH', headers: HS, body: JSON.stringify(patchBody) })
  if (!r.ok) out.push('patch fail ' + table + ' ' + mc_id + ': ' + r.status)
}

// categories
const cats = await (await fetch(SB + '/rest/v1/categories?select=mc_id,name,img,sliders', { headers: HS })).json()
let done = 0
for (const c of cats) {
  const img = c.img ? await brand(c.img, 'cat-' + c.mc_id) : c.img
  const sliders = []
  for (let i = 0; i < (c.sliders || []).length; i++) sliders.push(await brand(c.sliders[i], 'cat-' + c.mc_id + '-s' + i))
  await patch('categories', c.mc_id, { img, sliders })
  done++
  out.push('cat ' + c.mc_id + ' ' + c.name + ' ok')
}
// departments
const deps = await (await fetch(SB + '/rest/v1/departments?select=mc_id,name,img,sliders', { headers: HS })).json()
for (const d of deps) {
  const img = d.img ? await brand(d.img, 'dep-' + d.mc_id) : d.img
  const sliders = []
  for (let i = 0; i < (d.sliders || []).length; i++) sliders.push(await brand(d.sliders[i], 'dep-' + d.mc_id + '-s' + i))
  await patch('departments', d.mc_id, { img, sliders })
  done++
}
out.push('TOTAL branded: ' + done)
writeFileSync('brand-out.txt', out.join('\n'))
