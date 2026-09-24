import { writeFileSync } from 'node:fs'
const out = []
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWRwaHZtb2RvZnFnaHlodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzUwODgsImV4cCI6MjEwNTc1MTA4OH0.TwsH8wnYf_h9j9ZYQQ6mMoXUK43lwR9GaCzqaVZHq4o'
const H = { apikey: anon, Authorization: 'Bearer ' + anon }
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'

const cats = await (await fetch(SB + '/rest/v1/categories?select=mc_id,name,img&order=sort.asc', { headers: H })).json()
out.push('sections with images: ' + cats.filter((c) => c.img).length + '/' + cats.length)
out.push('  ' + cats.map((c) => c.name).join(' | '))

const deps = await (await fetch(SB + '/rest/v1/departments?select=mc_id&img=neq.', { headers: H })).json()
out.push('departments with images: ' + deps.length)

const priced = await (await fetch(SB + '/rest/v1/products?select=mc_id&sell_unit_price=gt.0&is_available=eq.true', { headers: H })).json()
out.push('available products with real prices: ' + priced.length)

const sample = await (await fetch(SB + '/rest/v1/products?select=name,sell_unit_price&sell_unit_price=gt.0&order=sell_unit_price.asc&limit=3', { headers: H })).json()
out.push('cheapest: ' + JSON.stringify(sample))

// live order flow sanity
const ord = await fetch('https://play-zedan.vercel.app/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_mc_id: 1145, id_user: '5129988776', customer_wallet: '0999555666' }) })
const oj = await ord.json()
out.push('live order test: ' + (oj.ok ? 'OK ' + oj.code : 'FAIL ' + oj.error))
writeFileSync('final2.txt', out.join('\n'))
