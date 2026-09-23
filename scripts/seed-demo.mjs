// Seeds the demo catalog into Supabase directly (local helper mirroring _lib seedDemoCatalog)
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

const DEMO = [
  { mc_id: 900001, name: '60 شدة ببجي عالمي', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min: 0, max: 0, unit: 0.85, check: true, dep_id: 901, dep: 'ببجي موبايل', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900002, name: '325 شدة ببجي عالمي', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min: 0, max: 0, unit: 4.1, check: true, dep_id: 901, dep: 'ببجي موبايل', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900003, name: '660 شدة ببجي عالمي', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min: 0, max: 0, unit: 8.05, check: true, dep_id: 901, dep: 'ببجي موبايل', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900004, name: '1800 شدة ببجي عالمي', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min: 0, max: 0, unit: 21.2, check: true, dep_id: 901, dep: 'ببجي موبايل', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900005, name: '100 جوهرة فري فاير', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min: 0, max: 0, unit: 0.92, check: true, dep_id: 902, dep: 'فري فاير', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900006, name: '310 جوهرة فري فاير', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min: 0, max: 0, unit: 2.7, check: true, dep_id: 902, dep: 'فري فاير', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900007, name: '520 جوهرة فري فاير', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min: 0, max: 0, unit: 4.4, check: true, dep_id: 902, dep: 'فري فاير', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900008, name: '1080 جوهرة فري فاير', info: 'يستغرق الشحن من 1 إلى 15 دقيقة', min: 0, max: 0, unit: 8.9, check: true, dep_id: 902, dep: 'فري فاير', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900009, name: '60 جيمز فورتنايت', info: 'يستغرق الشحن من 5 إلى 30 دقيقة', min: 0, max: 0, unit: 0.65, check: false, dep_id: 903, dep: 'فورتنايت', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900010, name: '1000 جيمز فورتنايت', info: 'يستغرق الشحن من 5 إلى 30 دقيقة', min: 0, max: 0, unit: 9.2, check: false, dep_id: 903, dep: 'فورتنايت', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900011, name: '300 جوهرة لودو لاما', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min: 0, max: 0, unit: 0.9, check: false, dep_id: 904, dep: 'LAMA LUDO', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900012, name: '1575 جوهرة لودو لاما', info: 'يستغرق الشحن من 1 إلى 10 دقائق', min: 0, max: 0, unit: 4.3, check: false, dep_id: 904, dep: 'LAMA LUDO', top_id: 46, top: 'شحن الألعاب', type: 'id' },
  { mc_id: 900013, name: 'واها شات / حسب الطلب', info: 'أدخل الكمية المطلوبة (500 — 500000)', min: 500, max: 500000, unit: 0.00038, check: false, dep_id: 133, dep: 'Waha Chat', top_id: 47, top: 'شحن التطبيقات', type: 'id' },
  { mc_id: 900014, name: 'تامي شات / حسب الطلب', info: 'أدخل الكمية المطلوبة (500 — 500000)', min: 500, max: 500000, unit: 0.00036, check: false, dep_id: 134, dep: 'Tami Chat', top_id: 47, top: 'شحن التطبيقات', type: 'id' },
  { mc_id: 900015, name: 'سوالفنا شات / حسب الطلب', info: 'أدخل الكمية المطلوبة (500 — 300000)', min: 500, max: 300000, unit: 0.00035, check: false, dep_id: 135, dep: 'سوالفنا شات', top_id: 47, top: 'شحن التطبيقات', type: 'id' },
  { mc_id: 900016, name: 'اهلا شات / حسب الطلب', info: 'أدخل الكمية المطلوبة (500 — 200000)', min: 500, max: 200000, unit: 0.00034, check: false, dep_id: 136, dep: 'اهلا شات', top_id: 47, top: 'شحن التطبيقات', type: 'id' },
  { mc_id: 900017, name: 'يوي شات / حسب الطلب', info: 'أدخل الكمية المطلوبة (500 — 200000)', min: 500, max: 200000, unit: 0.00033, check: false, dep_id: 137, dep: 'YOOY CHAT', top_id: 47, top: 'شحن التطبيقات', type: 'id' },
  { mc_id: 900018, name: 'بطاقة Google Play أمريكية 5$', info: 'تسليم الكود فوراً بعد التأكيد', min: 0, max: 0, unit: 6.4, check: false, dep_id: 138, dep: 'بطاقات رقمية', top_id: 47, top: 'شحن التطبيقات', type: 'code' },
  { mc_id: 900019, name: 'بطاقة iTunes أمريكية 10$', info: 'تسليم الكود فوراً بعد التأكيد', min: 0, max: 0, unit: 12.2, check: false, dep_id: 138, dep: 'بطاقات رقمية', top_id: 47, top: 'شحن التطبيقات', type: 'code' },
  { mc_id: 900020, name: 'بطاقة PlayStation Store 10$', info: 'تسليم الكود فوراً بعد التأكيد', min: 0, max: 0, unit: 12.5, check: false, dep_id: 138, dep: 'بطاقات رقمية', top_id: 47, top: 'شحن التطبيقات', type: 'code' },
  { mc_id: 900021, name: 'عضوية Telegram Premium شهر', info: 'تفعيل خلال دقائق', min: 0, max: 0, unit: 3.6, check: false, dep_id: 139, dep: 'خدمات التواصل', top_id: 47, top: 'شحن التطبيقات', type: 'code' },
  { mc_id: 900022, name: '1000 ستار تيليجرام', info: 'تسليم فوري', min: 0, max: 0, unit: 3.1, check: false, dep_id: 139, dep: 'خدمات التواصل', top_id: 47, top: 'شحن التطبيقات', type: 'code' },
  { mc_id: 900023, name: 'رصيد سيرياتيل 10 وحدة', info: 'أدخل رقم الهاتف — فوري', min: 0, max: 0, unit: 0.35, check: false, dep_id: 140, dep: 'سيرياتيل', top_id: 48, top: 'الرصيد و الإتصالات', type: 'id' },
  { mc_id: 900024, name: 'رصيد MTN 10 وحدة', info: 'أدخل رقم الهاتف — فوري', min: 0, max: 0, unit: 0.33, check: false, dep_id: 141, dep: 'MTN', top_id: 48, top: 'الرصيد و الإتصالات', type: 'id' },
  { mc_id: 900025, name: 'باقة إنترنت سيرياتيل 5GB', info: 'أدخل رقم الهاتف — تفعيل خلال دقائق', min: 0, max: 0, unit: 1.9, check: false, dep_id: 142, dep: 'باقات إنترنت', top_id: 48, top: 'الرصيد و الإتصالات', type: 'id' },
  { mc_id: 900026, name: 'باقة إنترنت MTN 5GB', info: 'أدخل رقم الهاتف — تفعيل خلال دقائق', min: 0, max: 0, unit: 1.85, check: false, dep_id: 142, dep: 'باقات إنترنت', top_id: 48, top: 'الرصيد و الإتصالات', type: 'id' },
]

// settings for pricing
const setRes = await fetch(url + '/rest/v1/settings?select=key,value', { headers: { apikey: key, Authorization: 'Bearer ' + key } })
const settings = Object.fromEntries((await setRes.json()).map((r) => [r.key, r.value]))
const rate = Number(settings.usd_rate || 15000)
const markup = Number(settings.markup_percent || 12)
const sell = (usd) => Math.ceil((usd * rate * (1 + markup / 100)) / 100) * 100

const rows = DEMO.map((p) => ({
  mc_id: p.mc_id, name: p.name, type: p.type, info: p.info, img: '',
  min_qty: p.min, max_qty: p.max, is_available: true, price: p.unit, unit_price: p.unit,
  sell_unit_price: sell(p.unit), can_check: p.check, is_url: false,
  department_id: p.dep_id, department_name: p.dep, top_category_id: p.top_id, top_category_name: p.top,
}))

const res = await fetch(url + '/rest/v1/products?columns=mc_id,name,type,info,img,min_qty,max_qty,is_available,price,unit_price,sell_unit_price,can_check,is_url,department_id,department_name,top_category_id,top_category_name', {
  method: 'POST',
  headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify(rows),
})
console.log('seed ->', res.status, (await res.text()).slice(0, 200))
console.log('sample sell price 60 UC:', sell(0.85), 'SYP')
