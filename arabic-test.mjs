import sharp from 'sharp'
const svg = `<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D3B75"/>
      <stop offset="0.55" stop-color="#4A1F52"/>
      <stop offset="1" stop-color="#38173F"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="400" fill="url(#bg)"/>
  <circle cx="1100" cy="60" r="180" fill="#F2B01E" opacity="0.15"/>
  <text x="600" y="180" font-family="Arial" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">خصومات حتى 20%</text>
  <text x="600" y="250" font-family="Arial" font-size="30" font-weight="bold" fill="#F2B01E" text-anchor="middle">على كل خدمات الشحن — الدفع عبر شام كاش</text>
  <text x="600" y="340" font-family="Arial" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">MOBILY <tspan fill="#F2B01E">BRO+</tspan></text>
</svg>`
await sharp(Buffer.from(svg)).png().toFile('arabic-test.png')
console.log('saved')
