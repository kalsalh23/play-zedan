import { readFileSync } from 'node:fs'
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const HS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
const r = await fetch('https://xwydphvmodofqghyhvxa.supabase.co/rest/v1/banners?columns=id,img,link,title,sort,active', {
  method: 'POST', headers: { ...HS, Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify([{ img: 'https://xwydphvmodofqghyhvxa.supabase.co/storage/v1/object/public/branding/banner-1.webp', link: '/c/46', title: '', sort: 1, active: true }]),
})
console.log(r.status, (await r.text()).slice(0, 300))
