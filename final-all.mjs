import { writeFileSync } from 'node:fs'
const out = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWRwaHZtb2RvZnFnaHlodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzUwODgsImV4cCI6MjEwNTc1MTA4OH0.TwsH8wnYf_h9j9ZYQQ6mMoXUK43lwR9GaCzqaVZHq4o'
const H = { apikey: anon, Authorization: 'Bearer ' + anon }
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'

// 1. wait for branding to finish: count -t3 images
let t3 = 0, deps = 116
for (let i = 0; i < 20; i++) {
  await wait(20000)
  const rows = await (await fetch(SB + '/rest/v1/departments?select=img&img=neq.', { headers: H })).json()
  deps = rows.length
  t3 = rows.filter((r) => r.img.includes('-t3.webp')).length
  out.push('check ' + i + ': departments=' + deps + ' t3-branded=' + t3)
  if (deps > 0 && t3 >= deps - 2) break
}

// 2. wait for deployment: bundle contains slider fix marker (min-w-full) and hero
let hero = false
for (let i = 0; i < 14 && !hero; i++) {
  await wait(25000)
  const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
  const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
  if (!m) continue
  const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
  hero = js.includes('hero_title') && js.includes('min-w-full')
  out.push('deploy check ' + i + ': bundle=' + m[1] + ' hero+slider-fix=' + (hero ? 'YES' : 'no'))
}

// 3. sample branded image + new department
const dep = (await (await fetch(SB + '/rest/v1/departments?select=mc_id,name,img&mc_id=eq.268', { headers: H })).json())[0]
out.push('شدات بوبجي img: ' + (dep.img.includes('-t3') || dep.img.includes('gen-') ? 'branded ✓' : dep.img.slice(0, 80)))
const dc = await (await fetch(SB + '/rest/v1/departments?select=mc_id&limit=200', { headers: H })).json()
const pc = await (await fetch(SB + '/rest/v1/products?select=mc_id&sell_unit_price=gt.0', { headers: H })).json()
out.push('TOTAL: departments=' + dc.length + ' | priced products=' + pc.length)
writeFileSync('final-all.txt', out.join('\n'))
