// Shared server-side library for MOBILY BRO+ serverless functions.
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

export const SB_URL = process.env.VITE_SUPABASE_URL
export const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } })

export const MC_BASE = 'https://app.market-card99.com/api/v2'

// ---------- settings ----------
export async function getSettings() {
  const { data, error } = await sb.from('settings').select('key,value')
  if (error) throw new Error('settings: ' + error.message)
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]))
}

export async function upsertSettings(obj) {
  const rows = Object.entries(obj).map(([key, value]) => ({ key, value: String(value ?? '') }))
  if (!rows.length) return
  const { error } = await sb.from('settings').upsert(rows, { onConflict: 'key' })
  if (error) throw new Error('settings upsert: ' + error.message)
}

export async function log(scope, message, meta = null) {
  try {
    await sb.from('logs').insert({ scope, message, meta })
  } catch {}
}

// ---------- admin auth ----------
export function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex')
}

export function issueToken(passwordHash) {
  const secret = process.env.ADMIN_SECRET || 'mobilybro-secret'
  return crypto.createHmac('sha256', secret).update('admin|' + passwordHash).digest('hex')
}

export function verifyToken(token, passwordHash) {
  if (!token || !passwordHash) return false
  const expected = issueToken(passwordHash)
  const a = Buffer.from(String(token))
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function requireAdmin(req) {
  const s = await getSettings()
  const hash = s.admin_password_hash
  const token = req.headers['x-admin-token'] || ''
  if (!verifyToken(token, hash)) throw httpError(401, 'غير مصرح — سجّل الدخول من جديد')
  return s
}

export function httpError(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

// ---------- Market-Card client ----------
let mcCache = { token: null, at: 0 }

async function mcLogin(username, password) {
  const body = new URLSearchParams()
  body.append('username', username)
  body.append('password', password)
  let r = await fetch(MC_BASE + '/login', { method: 'POST', headers: { Accept: 'application/json' }, body })
  if (!r.ok && r.status === 422) {
    // some deployments expect email field
    const body2 = new URLSearchParams()
    body2.append('email', username)
    body2.append('password', password)
    r = await fetch(MC_BASE + '/login', { method: 'POST', headers: { Accept: 'application/json' }, body: body2 })
  }
  const txt = await r.text()
  let j
  try { j = JSON.parse(txt) } catch { throw new Error('رد غير متوقع من Market-Card: ' + txt.slice(0, 120)) }
  if (!j.token) throw new Error('فشل دخول Market-Card: ' + (j.msg || j.message || txt.slice(0, 120)))
  return j.token
}

export async function mcToken(settings) {
  const { mc_username, mc_password } = settings
  if (!mc_username || !mc_password) throw httpError(400, 'بيانات حساب Market-Card غير مضبوطة — أدخلها من الإعدادات')
  const fresh = Date.now() - mcCache.at < 55 * 60 * 1000
  if (mcCache.token && fresh) return mcCache.token
  mcCache.token = await mcLogin(mc_username, mc_password)
  mcCache.at = Date.now()
  return mcCache.token
}

async function mcFetch(settings, path, opts = {}, retried = false) {
  const token = await mcToken(settings)
  const r = await fetch(MC_BASE + path, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + token, Accept: 'application/json' },
  })
  if ((r.status === 401 || r.status === 403) && !retried) {
    mcCache = { token: null, at: 0 }
    return mcFetch(settings, path, opts, true)
  }
  const txt = await r.text()
  let j
  try { j = JSON.parse(txt) } catch { throw new Error('رد غير متوقع من Market-Card: ' + txt.slice(0, 160)) }
  if (!r.ok) throw new Error('Market-Card ' + r.status + ': ' + (j.msg || j.message || txt.slice(0, 160)))
  return j
}

export const mcGet = (settings, path) => mcFetch(settings, path)
export const mcPostForm = (settings, path, fields) => {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null && v !== '') body.append(k, String(v))
  return mcFetch(settings, path, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
}

export async function mcSyncProducts(settings) {
  const cats = await mcGet(settings, '/categories')
  const topCats = cats?.data?.categories || []
  // department -> top category map
  const depMap = {}
  for (const c of topCats) {
    try {
      const subs = await mcGet(settings, '/categories/' + c.id)
      for (const d of subs?.data?.categories || []) {
        depMap[d.id] = { top_id: c.id, top_name: c.name, dep_name: d.name }
      }
    } catch {}
  }
  const all = await mcGet(settings, '/products')
  const products = all?.data?.products || []
  const rows = products.map((p) => ({
    mc_id: p.id,
    name: p.name || '',
    type: p.type || 'id',
    info: p.info || '',
    img: p.img || '',
    min_qty: p.min_qty || 0,
    max_qty: p.max_qty || 0,
    is_available: !!p.is_available,
    price: p.price || 0,
    unit_price: p.unit_price || 0,
    can_check: !!p.can_check,
    is_url: !!p.is_url,
    department_id: p.category_id || 0,
    department_name: p.category_name || (depMap[p.category_id]?.dep_name ?? ''),
    top_category_id: depMap[p.category_id]?.top_id ?? 0,
    top_category_name: depMap[p.category_id]?.top_name ?? '',
    updated_at: new Date().toISOString(),
  }))
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from('products').upsert(rows.slice(i, i + 200), { onConflict: 'mc_id' })
    if (error) throw new Error('products upsert: ' + error.message)
  }
  return { products: rows.length, departments: Object.keys(depMap).length }
}

export async function createMcBill(settings, { product_id, id_user, amount }) {
  const fields = { product_id, id_user, amount: amount ?? 1 }
  if (settings.mc_purchase_password) fields.old = settings.mc_purchase_password
  return mcPostForm(settings, '/bills', fields)
}

export async function getMcBill(settings, id) {
  return mcGet(settings, '/bills/' + id)
}

// ---------- pricing / helpers ----------
export function round100(n) {
  return Math.ceil(Number(n) / 100) * 100
}

export function computeSell(priceUsd, amount, s) {
  const rate = Number(s.usd_rate || 0)
  const markup = Number(s.markup_percent || 0)
  return round100(Number(priceUsd) * amount * rate * (1 + markup / 100))
}

export async function recalcSellPrices(s) {
  const { data: products, error } = await sb.from('products').select('mc_id,unit_price,price,price_override')
  if (error) throw new Error(error.message)
  const rows = []
  for (const p of products || []) {
    const unit = Number(p.price_override) > 0 ? Number(p.price_override) : Number(p.unit_price) > 0 ? Number(p.unit_price) : Number(p.price)
    const sell = unit > 0 ? computeSell(unit, 1, s) : 0
    rows.push({ mc_id: p.mc_id, sell_unit_price: sell })
  }
  for (let i = 0; i < rows.length; i += 200) {
    const { error: upErr } = await sb.from('products').upsert(rows.slice(i, i + 200), { onConflict: 'mc_id' })
    if (upErr) throw new Error(upErr.message)
  }
  return { count: rows.length }
}

// Demo catalog — realistic products matching Market-Card style (prices in USD wholesale)
const DEMO = [
  // top: شحن الألعاب (46)
  { mc_id: 900001, name: '60 شدة ببجي عالمي', type: 'id', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min_qty: 0, max_qty: 0, price: 0.85, unit_price: 0.85, can_check: true, dep: 'ببجي موبايل', dep_id: 901, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900002, name: '325 شدة ببجي عالمي', type: 'id', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min_qty: 0, max_qty: 0, price: 4.1, unit_price: 4.1, can_check: true, dep: 'ببجي موبايل', dep_id: 901, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900003, name: '660 شدة ببجي عالمي', type: 'id', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min_qty: 0, max_qty: 0, price: 8.05, unit_price: 8.05, can_check: true, dep: 'ببجي موبايل', dep_id: 901, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900004, name: '1800 شدة ببجي عالمي', type: 'id', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min_qty: 0, max_qty: 0, price: 21.2, unit_price: 21.2, can_check: true, dep: 'ببجي موبايل', dep_id: 901, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900005, name: '100 جوهرة فري فاير', type: 'id', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min_qty: 0, max_qty: 0, price: 0.92, unit_price: 0.92, can_check: true, dep: 'فري فاير', dep_id: 902, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900006, name: '310 جوهرة فري فاير', type: 'id', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min_qty: 0, max_qty: 0, price: 2.7, unit_price: 2.7, can_check: true, dep: 'فري فاير', dep_id: 902, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900007, name: '520 جوهرة فري فاير', type: 'id', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min_qty: 0, max_qty: 0, price: 4.4, unit_price: 4.4, can_check: true, dep: 'فري فاير', dep_id: 902, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900008, name: '1080 جوهرة فري فاير', type: 'id', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min_qty: 0, max_qty: 0, price: 8.9, unit_price: 8.9, can_check: true, dep: 'فري فاير', dep_id: 902, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900009, name: '60 جيمز فورتنايت', type: 'id', info: 'يستغرق الشحن من 5 إلى 30 دقيقة', min_qty: 0, max_qty: 0, price: 0.65, unit_price: 0.65, can_check: false, dep: 'فورتنايت', dep_id: 903, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900010, name: '1000 جيمز فورتنايت', type: 'id', info: 'يستغرق الشحن من 5 إلى 30 دقيقة', min_qty: 0, max_qty: 0, price: 9.2, unit_price: 9.2, can_check: false, dep: 'فورتنايت', dep_id: 903, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900011, name: '300 جوهرة لودو لاما', type: 'id', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min_qty: 0, max_qty: 0, price: 0.9, unit_price: 0.9, can_check: false, dep: 'LAMA LUDO', dep_id: 904, top: 'شحن الألعاب', top_id: 46 },
  { mc_id: 900012, name: '1575 جوهرة لودو لاما', type: 'id', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min_qty: 0, max_qty: 0, price: 4.3, unit_price: 4.3, can_check: false, dep: 'LAMA LUDO', dep_id: 904, top: 'شحن الألعاب', top_id: 46 },
  // top: شحن التطبيقات (47)
  { mc_id: 900013, name: 'واها شات / حسب الطلب', type: 'id', info: 'أدخل الكمية المطلوبة (500 — 500000)', min_qty: 500, max_qty: 500000, price: 0, unit_price: 0.00038, can_check: false, dep: 'Waha Chat', dep_id: 133, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900014, name: 'تامي شات / حسب الطلب', type: 'id', info: 'أدخل الكمية المطلوبة (500 — 500000)', min_qty: 500, max_qty: 500000, price: 0, unit_price: 0.00036, can_check: false, dep: 'Tami Chat', dep_id: 134, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900015, name: 'سوالفنا شات / حسب الطلب', type: 'id', info: 'أدخل الكمية المطلوبة (500 — 300000)', min_qty: 500, max_qty: 300000, price: 0, unit_price: 0.00035, can_check: false, dep: 'سوالفنا شات', dep_id: 135, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900016, name: 'اهلا شات / حسب الطلب', type: 'id', info: 'أدخل الكمية المطلوبة (500 — 200000)', min_qty: 500, max_qty: 200000, price: 0, unit_price: 0.00034, can_check: false, dep: 'اهلا شات', dep_id: 136, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900017, name: 'يوي شات / حسب الطلب', type: 'id', info: 'أدخل الكمية المطلوبة (500 — 200000)', min_qty: 500, max_qty: 200000, price: 0, unit_price: 0.00033, can_check: false, dep: 'YOOY CHAT', dep_id: 137, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900018, name: 'بطاقة Google Play أمريكية 5$', type: 'code', info: 'تسليم الكود فوراً بعد التأكيد', min_qty: 0, max_qty: 0, price: 6.4, unit_price: 6.4, can_check: false, dep: 'بطاقات رقمية', dep_id: 138, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900019, name: 'بطاقة iTunes أمريكية 10$', type: 'code', info: 'تسليم الكود فوراً بعد التأكيد', min_qty: 0, max_qty: 0, price: 12.2, unit_price: 12.2, can_check: false, dep: 'بطاقات رقمية', dep_id: 138, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900020, name: 'بطاقة PlayStation Store 10$', type: 'code', info: 'تسليم الكود فوراً بعد التأكيد', min_qty: 0, max_qty: 0, price: 12.5, unit_price: 12.5, can_check: false, dep: 'بطاقات رقمية', dep_id: 138, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900021, name: 'عضوية Telegram Premium شهر', type: 'code', info: 'تفعيل خلال دقائق', min_qty: 0, max_qty: 0, price: 3.6, unit_price: 3.6, can_check: false, dep: 'خدمات التواصل', dep_id: 139, top: 'شحن التطبيقات', top_id: 47 },
  { mc_id: 900022, name: '1000 ستار تيليجرام', type: 'code', info: 'تسليم فوري', min_qty: 0, max_qty: 0, price: 3.1, unit_price: 3.1, can_check: false, dep: 'خدمات التواصل', dep_id: 139, top: 'شحن التطبيقات', top_id: 47 },
  // top: الرصيد والاتصالات (48)
  { mc_id: 900023, name: 'رصيد سيرياتيل 10 وحدة', type: 'id', info: 'أدخل رقم الهاتف — فوري', min_qty: 0, max_qty: 0, price: 0.35, unit_price: 0.35, can_check: false, dep: 'سيرياتيل', dep_id: 140, top: 'الرصيد و الإتصالات', top_id: 48 },
  { mc_id: 900024, name: 'رصيد MTN 10 وحدة', type: 'id', info: 'أدخل رقم الهاتف — فوري', min_qty: 0, max_qty: 0, price: 0.33, unit_price: 0.33, can_check: false, dep: 'MTN', dep_id: 141, top: 'الرصيد و الإتصالات', top_id: 48 },
  { mc_id: 900025, name: 'باقة إنترنت سيرياتيل 5GB', type: 'id', info: 'أدخل رقم الهاتف — تفعيل خلال دقائق', min_qty: 0, max_qty: 0, price: 1.9, unit_price: 1.9, can_check: false, dep: 'باقات إنترنت', dep_id: 142, top: 'الرصيد و الإتصالات', top_id: 48 },
  { mc_id: 900026, name: 'باقة إنترنت MTN 5GB', type: 'id', info: 'أدخل رقم الهاتف — تفعيل خلال دقائق', min_qty: 0, max_qty: 0, price: 1.85, unit_price: 1.85, can_check: false, dep: 'باقات إنترنت', dep_id: 142, top: 'الرصيد و الإتصالات', top_id: 48 },
]

export async function seedDemoCatalog(s) {
  const rows = DEMO.map((p) => ({
    mc_id: p.mc_id,
    name: p.name,
    type: p.type,
    info: p.info,
    img: '',
    min_qty: p.min_qty,
    max_qty: p.max_qty,
    is_available: true,
    price: p.price,
    unit_price: p.unit_price,
    can_check: p.can_check,
    is_url: false,
    department_id: p.dep_id,
    department_name: p.dep,
    top_category_id: p.top_id,
    top_category_name: p.top,
    updated_at: new Date().toISOString(),
  }))
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await sb.from('products').upsert(rows.slice(i, i + 100), { onConflict: 'mc_id' })
    if (error) throw new Error('demo seed: ' + error.message)
  }
  await recalcSellPrices(s)
  return rows.length
}

export function genOrderCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[crypto.randomInt(chars.length)]
  return 'MB' + s
}

export async function genUniquePayAmount(baseSell) {
  const base = round100(baseSell)
  for (let i = 0; i < 40; i++) {
    const k = crypto.randomInt(1, 100)
    const pay = base + k
    const { count } = await sb
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('pay_amount', pay)
      .eq('status', 'awaiting_payment')
    if (!count) return pay
  }
  return base + crypto.randomInt(100, 100000)
}

// ---------- response helpers ----------
export function ok(res, data) {
  return res.status(200).json({ ok: true, ...data })
}

export function fail(res, err) {
  const status = err?.status || 500
  if (status >= 500) console.error(err)
  return res.status(status).json({ ok: false, error: err?.message || 'خطأ غير متوقع' })
}

export async function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch { resolve({}) }
    })
  })
}
