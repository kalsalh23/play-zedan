// probe /sections + /categories/{id} shapes
import { writeFileSync } from 'node:fs'
const out = []
const B = 'https://app.market-card99.com/api/v2'
const jget = async (p) => {
  const r = await fetch(B + p, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } })
  return { status: r.status, j: await r.json().catch(() => null) }
}
const s = await jget('/sections')
out.push('/sections -> ' + s.status + ' ' + JSON.stringify(s.j).slice(0, 600))
const c = await jget('/categories/46')
const cj = c.j?.data || {}
out.push('/categories/46 keys: ' + Object.keys(cj).join(','))
out.push('  subcats: ' + (cj.categories || []).length + ' | products: ' + (cj.products || []).length)
out.push('  subcat sample: ' + JSON.stringify((cj.categories || [])[0] || null).slice(0, 300))
out.push('  product sample: ' + JSON.stringify((cj.products || [])[0] || null).slice(0, 300))
out.push('  category sliders: ' + JSON.stringify(cj.category?.sliders || []).slice(0, 200))
writeFileSync('probe-out.txt', out.join('\n'))
