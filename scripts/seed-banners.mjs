// Generate 3 default branded offer banners and seed them into the banners table
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
const out = []
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }

function bannerSvg({ badge, title, sub, big }) {
  return Buffer.from(`<svg width="1200" height="420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D3B75"/>
      <stop offset="0.55" stop-color="#4A1F52"/>
      <stop offset="1" stop-color="#38173F"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="420" fill="url(#bg)"/>
  <circle cx="1080" cy="70" r="190" fill="#F2B01E" opacity="0.14"/>
  <circle cx="80" cy="380" r="130" fill="#ffffff" opacity="0.06"/>
  <text x="1140" y="300" font-family="Arial" font-size="200" font-weight="900" fill="#ffffff" text-anchor="middle" opacity="0.08">%</text>
  <text x="600" y="90" font-family="Arial" font-size="30" font-weight="900" fill="#F2B01E" text-anchor="middle">${badge}</text>
  <text x="600" y="190" font-family="Arial" font-size="${big ? 76 : 62}" font-weight="900" fill="#ffffff" text-anchor="middle">${title}</text>
  <text x="600" y="265" font-family="Arial" font-size="30" font-weight="bold" fill="#F2B01E" text-anchor="middle">${sub}</text>
  <rect x="470" y="310" width="260" height="60" rx="30" fill="#F2B01E"/>
  <text x="600" y="350" font-family="Arial" font-size="26" font-weight="900" fill="#38173F" text-anchor="middle">اطلب الآن</text>
  <text x="600" y="405" font-family="Arial" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3" opacity="0.85">MOBILY <tspan fill="#F2B01E">BRO+</tspan></text>
</svg>`)
}

const banners = [
  { key: 'banner-1.webp', link: '/c/46', svg: bannerSvg({ badge: 'عرض محدود 🔥', title: 'خصومات حتى 20%', sub: 'على شحن ببجي وفري فاير وكل الألعاب — الدفع عبر شام كاش', big: true }) },
  { key: 'banner-2.webp', link: '/c/47', svg: bannerSvg({ badge: 'جديد ✨', title: 'اشتراكات وباقات للتطبيقات', sub: 'تلجرام، شاهد، Netflix، كوكل بلاي وأكثر — تسليم سريع', big: false }) },
  { key: 'banner-3.webp', link: '/c/48', svg: bannerSvg({ badge: 'فوري ⚡', title: 'رصيد وباقات الإنترنت', sub: 'سيرياتيل و MTN وجميع الشركات — تفعيل خلال دقائق', big: false }) },
]

// ensure bucket
await fetch(SB + '/storage/v1/bucket', { method: 'POST', headers: HS, body: JSON.stringify({ name: 'branding', public: true }) })

// only seed if table empty
const existing = await (await fetch(SB + '/rest/v1/banners?select=id', { headers: HS })).json()
if (existing.length) {
  out.push('banners already exist: ' + existing.length + ' — skipping seed')
} else {
  let sort = 0
  for (const b of banners) {
    const webp = await sharp(b.svg).webp({ quality: 88 }).toBuffer()
    const up = await fetch(SB + '/storage/v1/object/branding/' + b.key, {
      method: 'POST', headers: { Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true' }, body: webp,
    })
    if (!up.ok) { out.push('upload fail ' + b.key + ': ' + up.status); continue }
    const r = await fetch(SB + '/rest/v1/banners', {
      method: 'POST', headers: HS,
      body: JSON.stringify([{ img: SB + '/storage/v1/object/public/branding/' + b.key, link: b.link, title: '', sort: ++sort, active: true }]),
    })
    out.push('seeded ' + b.key + ': ' + r.status)
  }
}
writeFileSync('seed-banners-out.txt', out.join('\n'))
