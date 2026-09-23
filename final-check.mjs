import { writeFileSync } from 'node:fs'
const out = []
const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
out.push('live bundle: ' + (m ? m[1] : 'NOT FOUND') + ' | expected new: CCZmaLmb')
out.push('verdict: ' + (m && m[1] === 'CCZmaLmb' ? 'NEW MARKET-CARD DESIGN IS LIVE ✅' : 'still old ❌'))
writeFileSync('final-check.txt', out.join('\n'))
