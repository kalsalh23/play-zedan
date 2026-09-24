import { writeFileSync } from 'node:fs'
const out = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let done = false
for (let i = 0; i < 16 && !done; i++) {
  await wait(25000)
  try {
    const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
    const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
    if (!m) { out.push(i + ': no bundle'); continue }
    const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
    const has = js.includes('hero_title') && !js.includes('عروض وخصومات أسبوعية')
    out.push(i + ': bundle=' + m[1] + ' hero=' + (has ? 'YES' : 'no'))
    if (has) done = true
  } catch (e) { out.push(i + ' err: ' + e.message) }
}
out.push('RESULT: ' + (done ? 'HERO LIVE ✅' : 'NOT YET ❌'))
writeFileSync('hero3.txt', out.join('\n'))
