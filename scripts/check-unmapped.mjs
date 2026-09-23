import { readFileSync } from 'node:fs'
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-temp-token.txt', 'utf8').trim()

const cats = (await (await fetch(B + '/categories', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })).json())?.data?.categories || []
const depMap = new Set()
const topIds = new Set(cats.map((c) => c.id))
for (const c of cats) {
  try {
    const subs = (await (await fetch(B + '/categories/' + c.id, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })).json())?.data?.categories || []
    subs.forEach((d) => depMap.add(d.id))
  } catch {}
}
const products = (await (await fetch(B + '/products', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })).json())?.data?.products || []
const unmapped = {}
for (const p of products) {
  if (depMap.has(p.category_id) || topIds.has(p.category_id)) continue
  const k = p.category_id + ' | ' + (p.category_name || '?')
  unmapped[k] = (unmapped[k] || 0) + 1
}
console.log('unmapped groups:')
Object.entries(unmapped).forEach(([k, v]) => console.log(' ', k, '=>', v))
