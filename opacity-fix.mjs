import { writeFileSync } from 'node:fs'
const out = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let done = false
for (let i = 0; i < 12 && !done; i++) {
  await wait(25000)
  const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
  const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
  if (!m) continue
  const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
  done = js.includes('hero-track') && !js.includes('opacity-60')
  out.push(i + ': bundle=' + m[1] + ' full-opacity=' + (done ? 'YES ✅' : 'still dim'))
}
out.push('RESULT: ' + (done ? 'VIVID SLIDER LIVE ✅' : 'pending'))
writeFileSync('opacity-fix.txt', out.join('\n'))
