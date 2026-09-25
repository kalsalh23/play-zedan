import { writeFileSync } from 'node:fs'
const out = []
const html = await (await fetch('https://play-zedan.vercel.app/?v=' + Date.now())).text()
const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
const js = await (await fetch('https://play-zedan.vercel.app/assets/index-' + m[1] + '.js?v=' + Date.now())).text()
out.push('bundle: ' + m[1])
out.push('ad slider (hero-track): ' + (js.includes('hero-track') ? '✓' : '✗'))
out.push('bottom nav 4 items (admin): ' + (js.includes('grid-cols-4') && js.includes('/admin') ? '✓' : '✗'))
out.push('universal package sheet: ' + (js.includes('الباقات المتوفرة') && js.includes('in("department_id"') ? '✓' : '✗'))
out.push('grouped packages: ' + (js.includes('اختر الباقة') ? '✓' : '✗'))
out.push('USD pricing: ' + (js.includes('toFixed(2)') ? '✓' : '✗'))
// live purchase flow once more
const ord = await fetch('https://play-zedan.vercel.app/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_mc_id: 1145, id_user: '5129988776' }) })
const oj = await ord.json()
out.push('order flow: ' + (oj.ok ? 'OK ' + oj.code : 'FAIL ' + oj.error))
writeFileSync('grand-final.txt', out.join('\n'))
