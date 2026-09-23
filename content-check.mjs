import { writeFileSync } from 'node:fs'
const out = []
// check DEL84's own bundle content for the new UI markers
for (const u of ['https://play-zedan.vercel.app', 'https://play-zedan-a00j3t1vl-kalsalh23s-projects.vercel.app']) {
  try {
    const html = await (await fetch(u + '/?v=' + Date.now())).text()
    const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
    let hasNew = false
    if (m) {
      const js = await (await fetch(u + '/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
      hasNew = js.includes('departments') && js.includes('aspect-square')
    }
    out.push(u.replace('https://', '') + ' | bundle=' + (m ? m[1] : '?') + ' | newUI=' + hasNew)
  } catch (e) { out.push(u + ' ERR ' + e.message) }
}
writeFileSync('content-check.txt', out.join('\n'))
