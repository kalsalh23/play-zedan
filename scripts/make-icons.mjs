// Generates PWA icons (PNG) from an inline SVG via sharp.
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const svg = (pad = 0, rounded = true) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6D3B75"/>
      <stop offset="1" stop-color="#38173F"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
  <g transform="translate(88 118)">
    <path d="M48 80 h240 a40 40 0 0 1 40 40 v64 a64 64 0 0 1 -64 64 H72 A64 64 0 0 1 8 184 v-64 a40 40 0 0 1 40-40z" fill="#ffffff" opacity="0.14"/>
    <path d="M72 128 h64 M104 96 v64" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
    <circle cx="248" cy="112" r="17" fill="#F2B01E"/>
    <circle cx="288" cy="152" r="17" fill="#fff" opacity=".85"/>
  </g>
  <circle cx="396" cy="96" r="60" fill="#F2B01E"/>
  <path d="M396 58 v76 M358 96 h76" stroke="#38173F" stroke-width="22" stroke-linecap="round"/>
</svg>`

mkdirSync('public/icons', { recursive: true })
const jobs = [
  ['public/icons/icon-192.png', 192, true],
  ['public/icons/icon-512.png', 512, true],
  ['public/icons/maskable-512.png', 512, false],
  ['public/icons/apple-touch-icon.png', 180, true],
]
for (const [out, size, rounded] of jobs) {
  await sharp(Buffer.from(svg(rounded ? 112 : 0, rounded))).resize(size, size).png().toFile(out)
  writeFileSync('icon_debug.svg', svg())
  console.log('OK', out)
}
