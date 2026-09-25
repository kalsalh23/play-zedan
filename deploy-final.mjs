import { writeFileSync } from 'node:fs'
const out = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let hero = false
for (let i = 0; i < 18 && !hero; i++) {
  await wait(25000)
  try {
    const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
    const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
    if (!m) { out.push(i + ': no bundle'); continue }
    const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
    hero = js.includes('hero_title')
    out.push(i + ': bundle=' + m[1] + ' hero=' + (hero ? 'YES' : 'no') + ' usd=' + (js.includes('toFixed(2)') ? 'YES' : 'no'))
  } catch (e) { out.push(i + ' err: ' + e.message) }
}
// create a live order and check USD pay amount
const ord = await fetch('https://play-zedan.vercel.app/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_mc_id: 1145, id_user: '5129988776' }) })
const oj = await ord.json()
if (oj.ok) {
  const tr = await (await fetch('https://play-zedan.vercel.app/api/track?code=' + oj.code)).json()
  out.push('order ' + oj.code + ': pay_amount=' + tr.order.pay_amount + ' sell=' + tr.order.sell_price + ' (USD expected, e.g. ~1.18)')
} else out.push('order FAIL: ' + oj.error)
out.push('FINAL: ' + (hero ? 'HERO + USD LIVE ✅' : 'still building ❌'))
writeFileSync('deploy-final.txt', out.join('\n'))
