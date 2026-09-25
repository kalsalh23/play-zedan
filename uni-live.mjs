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
  deployed = js.includes("'/admin'") && js.includes('grid-cols-4') && js.includes('hero-track')
  out.push(i + ': bundle=' + m[1] + ' admin-nav+universal-sheets=' + (deployed ? 'YES ✅' : 'no'))
}
out.push('RESULT: ' + (deployed ? 'ALL LIVE ✅' : 'pending ❌'))
writeFileSync('uni-live.txt', out.join('\n'))
