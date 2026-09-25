import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()
const H = { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN }

// probe /categories/{depId} for the "empty" departments
for (const id of [3, 4, 110, 62, 166, 35]) {
  try {
    const j = await (await fetch(B + '/categories/' + id, { headers: H })).json()
    const d = j?.data || {}
    const cats = (d.categories || []).length
    const prods = (d.products || []).length
    out.push(`/categories/${id} -> cats=${cats} products=${prods}` + (prods ? ' | sample: ' + JSON.stringify(d.products.slice(0, 3).map((p) => p.name + ' $' + p.unit_price)) : ''))
  } catch (e) { out.push('/categories/' + id + ' ERR ' + e.message) }
}
writeFileSync('cat-probe.txt', out.join('\n'))
