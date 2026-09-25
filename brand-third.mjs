// Re-brand: cover 1/3 of each category/department image with MOBILY BRO+ bar (v2 keys)
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const PUBLIC_BASE = SB + '/storage/v1/object/public/branding/'

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
  <rect x="0" y="${top ? barH : y}" width="${w}" height="4" fill="#F2B01E"/>
  <text x="${w / 2}" y="${y + barH / 2 + barH * 0.17}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.min(barH * 0.34, 44)}" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">MOBILY <tspan fill="#F2B01E">BRO+</tspan></text>
</svg>`)
}

const cache = new Map()
async function brandThird(url, key) {
  if (cache.has(url)) return cache.get(url)
  if (url.includes('-t3.webp')) { cache.set(url, url); return url }
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    const meta = await sharp(buf).metadata()
    const w = meta.width, h = meta.height
    const wide = h / w < 0.55
    const barH = Math.round(h / 3)
    const branded = await sharp(buf)
      .composite([{ input: brandSvg(w, h, barH, wide), top: 0, left: 0 }])
      .webp({ quality: 84 })
      .toBuffer()
    const up = await fetch(SB + '/storage/v1/object/branding/' + key + '-t3.webp', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
      body: branded,
    })
    if (!up.ok) throw new Error('upload ' + up.status)
    const publicUrl = PUBLIC_BASE + key + '-t3.webp'
    cache.set(url, publicUrl)
    return publicUrl
  } catch (e) {
    out.push('fail [' + key + ']: ' + e.message)
    cache.set(url, url)
    return url
  }
}

async function patch(table, mc_id, body) {
  const r = await fetch(SB + '/rest/v1/' + table + '?mc_id=eq.' + mc_id, { method: 'PATCH', headers: HS, body: JSON.stringify(body) })
  if (!r.ok) out.push('patch fail ' + mc_id + ': ' + r.status)
}

let n = 0
for (const table of ['categories', 'departments']) {
  const rows = await (await fetch(SB + '/rest/v1/' + table + '?select=mc_id,img,sliders', { headers: HS })).json()
  for (const r of rows) {
    if (!r.img || r.img.includes('/gen-')) continue // generated cards already fully branded
    const img = await brandThird(r.img, table.slice(0, 3) + '-' + r.mc_id)
    const sliders = []
    for (let i = 0; i < (r.sliders || []).length; i++) sliders.push(await brandThird(r.sliders[i], table.slice(0, 3) + '-' + r.mc_id + '-s' + i))
    await patch(table, r.mc_id, { img, sliders })
    n++
  }
}
out.push('rebranded (1/3): ' + n)
writeFileSync('brand2-out.txt', out.join('\n'))
