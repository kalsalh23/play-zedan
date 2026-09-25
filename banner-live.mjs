import { writeFileSync } from 'node:fs'
const out = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let deployed = false
for (let i = 0; i < 14 && !deployed; i++) {
  await wait(25000)
  try {
    const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
    const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
    if (!m) continue
    const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
    deployed = js.includes('hero-track')
    out.push(i + ': bundle=' + m[1] + ' banner-slider=' + (deployed ? 'YES' : 'no'))
  } catch (e) { out.push(i + ' err ' + e.message) }
}
// public banners API live?
const b = await fetch('https://play-zedan.vercel.app/api/banners?v=' + Date.now()).then(async (r) => ({ s: r.status, j: await r.json().catch(() => null) }))
out.push('banners API: ' + b.s + ' count=' + (b.j && b.j.banners ? b.j.banners.length : '?'))
out.push('RESULT: ' + (deployed && b.s === 200 ? 'AD SLIDER LIVE ✅' : 'pending ❌'))
writeFileSync('banner-live.txt', out.join('\n'))
