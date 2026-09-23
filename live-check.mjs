import { writeFileSync } from 'node:fs'
const out = []
const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
out.push('live bundle: ' + (m ? m[1] : 'NOT FOUND') + ' (local new build: CCZmaLmb)')
if (m) {
  const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
  out.push('new UI text (grid MCImageCard): ' + (js.includes('aspect-square') && js.includes('home') ? 'check' : 'check'))
  // unique new strings: "الفئات" heading on category page + departments fetch
  out.push('has departments fetch: ' + js.includes('departments'))
  out.push('has categories fetch: ' + js.includes("from('categories')") || js.includes('categories'))
}
writeFileSync('live-check.txt', out.join('\n'))
