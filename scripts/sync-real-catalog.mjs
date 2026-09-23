// Full real-catalog sync WITH tier pricing (uses temp account token)
import { readFileSync, existsSync } from 'node:fs'

function readEnv(file = '.env.local') {
  if (!existsSync(file)) return {}
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      })
  )
}

const env = readEnv()
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-temp-token.txt', 'utf8').trim()
const sbHeaders = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }

const sRes = await fetch(url + '/rest/v1/settings?select=key,value', { headers: sbHeaders })
const settings = Object.fromEntries((await sRes.json()).map((r) => [r.key, r.value]))
const rate = Number(settings.usd_rate || 15000)
const markup = Number(settings.markup_percent || 12)
const sell = (usd) => Math.ceil((Number(usd) * rate * (1 + markup / 100)) / 100) * 100

const jget = async (p, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(B + p, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })
      if (!r.ok) throw new Error(r.status)
      return r.json()
    } catch (e) {
      if (i === tries - 1) throw new Error(p + ' -> ' + e.message)
      await new Promise((res) => setTimeout(res, 800 * (i + 1)))
    }
  }
}

// category tree
const cats = (await jget('/categories'))?.data?.categories || []
const depMap = {}
const topMap = {}
for (const c of cats) {
  topMap[c.id] = c.name
  try {
    const subs = (await jget('/categories/' + c.id))?.data?.categories || []
    for (const d of subs) depMap[d.id] = { top_id: c.id, top_name: c.name, dep_name: d.name }
  } catch (e) {
    console.log('subs fail:', c.name, e.message)
  }
}
console.log('categories:', cats.length, 'departments:', Object.keys(depMap).length)

const products = (await jget('/products'))?.data?.products || []
console.log('products:', products.length)

const rows = products.map((p) => {
  let dep = depMap[p.category_id] || null
  if (!dep && topMap[p.category_id]) dep = { top_id: p.category_id, top_name: topMap[p.category_id], dep_name: topMap[p.category_id] }
  if (!dep) dep = { top_id: 999999, top_name: 'خدمات أخرى', dep_name: p.category_name || 'خدمات أخرى' }
  const unit = Number(p.unit_price) > 0 ? Number(p.unit_price) : Number(p.price) || 0
  return {
    mc_id: p.id,
    name: p.name || '',
    type: p.type || 'id',
    info: p.info || '',
    img: p.img || '',
    min_qty: p.min_qty || 0,
    max_qty: p.max_qty || 0,
    is_available: !!p.is_available && unit > 0,
    price: p.price || 0,
    unit_price: p.unit_price || 0,
    sell_unit_price: unit > 0 ? sell(unit) : 0,
    can_check: !!p.can_check,
    is_url: !!p.is_url,
    department_id: p.category_id || 0,
    department_name: p.category_name || dep.dep_name || '',
    top_category_id: dep.top_id,
    top_category_name: dep.top_name,
    label_player_id: p.label_player_id || '',
    label_name: p.label_name || '',
  }
})

let ok = 0
for (let i = 0; i < rows.length; i += 150) {
  const chunk = rows.slice(i, i + 150)
  const r = await fetch(url + '/rest/v1/products?columns=mc_id,name,type,info,img,min_qty,max_qty,is_available,price,unit_price,sell_unit_price,can_check,is_url,department_id,department_name,top_category_id,top_category_name,label_player_id,label_name', {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(chunk),
  })
  if (r.ok) ok += chunk.length
  else console.log('chunk fail @', i, r.status, (await r.text()).slice(0, 150))
}
console.log('upserted:', ok)

const withPrice = rows.filter((r) => r.sell_unit_price > 0).length
const withImg = rows.filter((r) => r.img).length
const withTop = rows.filter((r) => r.top_category_id).length
const avail = rows.filter((r) => r.is_available).length
console.log(JSON.stringify({ total: rows.length, withPrice, withImg, withTop, avail }))
const s = rows.find((r) => r.is_available && r.sell_unit_price > 0 && r.max_qty == 0)
console.log('sample:', s ? `${s.name} | ${s.department_name} | unit $${s.unit_price} -> ${s.sell_unit_price} SYP | ${s.img.slice(0, 60)}` : 'none')
