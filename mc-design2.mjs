// Fetch all lazy chunks and extract the categories/departments render markup
import { writeFileSync } from 'node:fs'
const out = []
const html = await (await fetch('https://market-card99.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
let main = await (await fetch('https://market-card99.com/static/js/main.afff5e5a.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
out.push('main size: ' + main.length)

// find chunk map
const chunkRefs = [...new Set([...main.matchAll(/static\/js\/([\w.-]+\.chunk\.js)/g)].map((m) => m[1]))]
out.push('chunks found in main: ' + JSON.stringify(chunkRefs))
const numMap = [...main.matchAll(/(\d+):\s*"([0-9a-f]{8,})"/g)].map((m) => m[1] + '.' + m[2] + '.chunk.js')
const allChunks = [...new Set([...chunkRefs, ...numMap])]
out.push('total candidate chunks: ' + allChunks.length)

let js = main
for (const c of allChunks.slice(0, 60)) {
  try {
    const t = await (await fetch('https://market-card99.com/static/js/' + c, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text()
    if (t.length > 500) js += '\n/*CHUNK:' + c + '*/\n' + t
  } catch {}
}
out.push('total js: ' + js.length)

function extract(label, reSrc, n, width) {
  out.push('\n===== ' + label + ' =====')
  const re = new RegExp(reSrc, 'gi')
  let found = 0
  for (const m of js.matchAll(re)) {
    const start = Math.max(0, m.index - width / 2)
    out.push('--- ' + js.slice(start, m.index + width).replace(/\s+/g, ' ').slice(0, width * 1.6))
    if (++found >= n) break
  }
  if (!found) out.push('(none)')
}

extract('Categories component area', 'categories', 6, 700)
extract('Departments component area', 'departments', 6, 700)
extract('col- grid patterns', 'col-6', 10, 300)
extract('card class patterns', '"card ', 10, 300)
extract('img fluid patterns', 'img-fluid|object-fit', 10, 260)
extract('sliders', 'sliders', 5, 400)
writeFileSync('mc-design.txt', out.join('\n'))
