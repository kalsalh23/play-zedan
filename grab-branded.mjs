import sharp from 'sharp'
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWRwaHZtb2RvZnFnaHlodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzUwODgsImV4cCI6MjEwNTc1MTA4OH0.TwsH8wnYf_h9j9ZYQQ6mMoXUK43lwR9GaCzqaVZHq4o'
const H = { apikey: anon, Authorization: 'Bearer ' + anon }
const SB = 'https://xwydphvmodofqghyhvxa.supabase.co'
const dep = (await (await fetch(SB + '/rest/v1/departments?select=name,img&mc_id=eq.40', { headers: H })).json())[0]
const buf = Buffer.from(await (await fetch(dep.img)).arrayBuffer())
await sharp(buf).resize(280, 280, { fit: 'inside' }).png().toFile('branded-sample.png')
console.log('saved', dep.img.slice(0, 90))
