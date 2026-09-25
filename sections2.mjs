import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()
const H = { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN }

for (const p of ['/sections/1', '/sections/2']) {
  try {
    const j = await (await fetch(B + p, { headers: H })).json()
    const d = j?.data || {}
    const prods = d.products || []
    out.push(p + ' -> keys: ' + Object.keys(d).join(',') + ' | products: ' + prods.length)
    if (prods.length) out.push('   sample: ' + JSON.stringify(prods.slice(0, 4).map((x) => ({ id: x.id, name: x.name, unit: x.unit_price }))))
    if ((d.categories || []).length) out.push('   nested cats: ' + JSON.stringify(d.categories.map((c) => c.id + ':' + c.name).slice(0, 8)))
  } catch (e) { out.push(p + ' ERR ' + e.message) }
}
writeFileSync('sections2-out.txt', out.join('\n'))
