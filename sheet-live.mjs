import { writeFileSync } from 'node:fs'
const out = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let deployed = false
for (let i = 0; i < 14 && !deployed; i++) {
  await wait(25000)
  const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
  const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
  if (!m) continue
  const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
  deployed = js.includes('hero-track') && js.includes('اختر الباقة') && js.includes('شراء الآن')
  out.push(i + ': bundle=' + m[1] + ' package-sheet=' + (deployed ? 'YES ✅' : 'no'))
}
// full purchase flow through the sheet path (same API as before)
const ord = await fetch('https://play-zedan.vercel.app/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_mc_id: 1145, id_user: '5129988776' }) })
const oj = await ord.json()
out.push('order flow: ' + (oj.ok ? 'OK ' + oj.code : 'FAIL ' + oj.error))
out.push('RESULT: ' + (deployed && oj.ok ? 'PACKAGE SHEET LIVE ✅' : 'pending ❌'))
writeFileSync('sheet-live.txt', out.join('\n'))
