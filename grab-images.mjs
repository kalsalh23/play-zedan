// Download sample images to inspect Market-Card branding placement
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWRwaHZtb2RvZnFnaHlodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzUwODgsImV4cCI6MjEwNTc1MTA4OH0.TwsH8wnYf_h9j9ZYQQ6mMoXUK43lwR9GaCzqaVZHq4o'
const H = { apikey: anon, Authorization: 'Bearer ' + anon }
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'

const cat = (await (await fetch(SB + '/rest/v1/categories?select=name,img,sliders&limit=3', { headers: H })).json())[1]
const dep = (await (await fetch(SB + '/rest/v1/departments?select=name,img,sliders&img=neq.&limit=3', { headers: H })).json())[0]

const targets = [
  ['cat-' + cat.name, cat.img],
  ['cat-slider', (cat.sliders || [])[0]],
  ['dep-' + dep.name, dep.img],
]
for (const [name, url] of targets) {
  if (!url) continue
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    await sharp(buf).resize(300, 300, { fit: 'inside' }).png().toFile('sample-' + name.replace(/[^\w-]/g, '') + '.png')
    const meta = await sharp(buf).metadata()
    console.log(name, '|', meta.width + 'x' + meta.height, '| saved')
  } catch (e) { console.log(name, 'ERR', e.message) }
}
