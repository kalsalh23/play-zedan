// Extract Market-Card UI design patterns from its JS bundle
import { writeFileSync } from 'node:fs'
const out = []
const html = await (await fetch('https://market-card99.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
const scripts = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1])
out.push('scripts: ' + JSON.stringify(scripts))
let js = ''
for (const s of scripts) {
  const url = s.startsWith('http') ? s : 'https://market-card99.com' + s
  try {
    js += '\n/*FILE:' + s + '*/\n' + await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
  } catch (e) { out.push('miss ' + s + ': ' + e.message) }
}
out.push('bundle size: ' + js.length)

function extract(label, reSrc, n = 6, width = 500) {
  out.push('\n===== ' + label + ' =====')
  const re = new RegExp(reSrc, 'gi')
  let found = 0
  for (const m of js.matchAll(re)) {
    const start = Math.max(0, m.index - width / 2)
    out.push('--- ' + js.slice(start, m.index + width).replace(/\s+/g, ' '))
    if (++found >= n) break
  }
  if (!found) out.push('(none)')
}

extract('grid-cols patterns', String.raw`grid-cols-\d`, 10, 260)
extract('aspect image cards', String.raw`aspect-\[|aspect-square|aspect-\d`, 10, 260)
extract('slider/horizontal', String.raw`swiper|overflow-x-auto|snap-x`, 8, 260)
extract('categories context', String.raw`categories`, 8, 300)
writeFileSync('mc-design.txt', out.join('\n'))
