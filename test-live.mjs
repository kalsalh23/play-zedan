// Live end-to-end test on production URL
const B = 'https://play-zedan.vercel.app'

async function jfetch(path, opts = {}) {
  const r = await fetch(B + path, opts)
  let j = null
  try { j = await r.json() } catch {}
  return { status: r.status, j, ct: r.headers.get('content-type') }
}

(async () => {
  // 1. storefront HTML
  const home = await fetch(B + '/')
  const html = await home.text()
  console.log('1) home page:', home.status, html.includes('MOBILY BRO+') ? 'OK branding' : 'MISSING branding', html.includes('Cairo') ? '+font' : '')

  // 2. manifest + sw
  const man = await fetch(B + '/manifest.webmanifest')
  console.log('2) manifest:', man.status, man.status === 200 ? 'OK' : 'FAIL')
  const sw = await fetch(B + '/sw.js')
  console.log('   sw.js:', sw.status)

  // 3. admin login wrong then right
  const bad = await jfetch('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'wrong' }) })
  console.log('3) wrong password:', bad.status === 401 ? 'OK blocked' : 'LEAK', bad.j && bad.j.error)
  const good = await jfetch('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'zedan-admin-2026' }) })
  const T = good.j && good.j.token
  console.log('   right password:', T ? 'OK token issued' : 'FAIL')

  // 4. track unknown
  const unk = await jfetch('/api/track?code=MBZZZZ99')
  console.log('4) unknown code:', unk.status === 404 ? 'OK' : 'FAIL', unk.j && unk.j.error)

  // 5. create order live
  const ord = await jfetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_mc_id: 900001, id_user: '5101122334', customer_wallet: '0999333444' }) })
  const code = ord.j && ord.j.code
  console.log('5) create order:', ord.j && ord.j.ok ? 'OK code=' + code : 'FAIL ' + JSON.stringify(ord.j))

  // 6. track shows unique amount + wallet from settings
  const tr = await jfetch('/api/track?code=' + code)
  const o = tr.j && tr.j.order
  console.log('6) track:', o ? `status=${o.status} pay=${o.pay_amount} wallet=${o.shamcash_number || '(empty)'} name=${o.shamcash_name || ''}` : 'FAIL')

  // 7. admin confirm
  const list = await jfetch('/api/admin-orders?status=awaiting_payment', { headers: { 'x-admin-token': T } })
  const target = list.j.orders.find((x) => x.code === code)
  console.log('7) admin list:', target ? 'OK found order' : 'FAIL')
  const conf = await jfetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': T }, body: JSON.stringify({ id: target.id, action: 'confirm' }) })
  console.log('   confirm:', conf.j && conf.j.ok ? conf.j.message : conf.j && conf.j.error)

  // 8. demo auto-complete
  await new Promise((r) => setTimeout(r, 11000))
  const fin = await jfetch('/api/track?code=' + code)
  console.log('8) final status:', fin.j.order.status, 'result=' + fin.j.order.result_code)
})().catch((e) => console.error('ERR', e.message))
