import { writeFileSync } from 'node:fs'
const out = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWRwaHZtb2RvZnFnaHlodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzUwODgsImV4cCI6MjEwNTc1MTA4OH0.TwsH8wnYf_h9j9ZYQQ6mMoXUK43lwR9GaCzqaVZHq4o'
const H = { apikey: anon, Authorization: 'Bearer ' + anon }
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'

let branded = 0, stable = 0
for (let i = 0; i < 30; i++) {
  await wait(30000)
  const rows = await (await fetch(SB + '/rest/v1/products?select=img&img=like.*prod-*-t3*', { headers: H })).json()
  branded = rows.length
  out.push('check ' + i + ': product images branded = ' + branded)
  if (branded === stable && branded > 500) break // finished
  stable = branded
}
// deployment check
let deployed = false
for (let i = 0; i < 10 && !deployed; i++) {
  await wait(20000)
  const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
  const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
  if (!m) continue
  const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
  deployed = js.includes('parent_id')
  out.push('deploy ' + i + ': bundle=' + m[1] + ' hierarchy=' + (deployed ? 'YES' : 'no'))
}
// hierarchy sanity: بوبجي عالمي children
const kids = await (await fetch(SB + '/rest/v1/departments?select=name&parent_id=eq.3', { headers: H })).json()
out.push('بوبجي عالمي children: ' + JSON.stringify(kids.map((k) => k.name)))
out.push('RESULT: ' + (deployed && branded > 500 ? 'ALL LIVE ✅' : 'partial — branding=' + branded))
writeFileSync('final3.txt', out.join('\n'))
