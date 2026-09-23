// Sync top categories + departments (with images/sliders) for the market-card style UI
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
const sb = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }

const jget = async (p, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(B + p, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } })
      if (!r.ok) throw new Error(r.status)
      return r.json()
    } catch (e) {
      if (i === tries - 1) throw new Error(p + ' -> ' + e.message)
      await new Promise((res) => setTimeout(res, 800 * (i + 1)))
    }
  }
}

const cats = (await jget('/categories'))?.data?.categories || []
const catRows = cats.map((c, i) => ({ mc_id: c.id, name: c.name || '', img: c.img || '', sliders: c.sliders || [], sort: i }))
const depRows = []
for (const c of cats) {
  try {
    const subs = (await jget('/categories/' + c.id))?.data?.categories || []
    for (const d of subs) depRows.push({ mc_id: d.id, name: d.name || '', img: d.img || '', sliders: d.sliders || [], top_id: c.id, top_name: c.name })
  } catch (e) {
    console.log('subs fail:', c.name, e.message)
  }
}

async function upsert(table, rows, cols) {
  for (let i = 0; i < rows.length; i += 100) {
    const r = await fetch(url + '/rest/v1/' + table + '?columns=' + cols, {
      method: 'POST',
      headers: { ...sb, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows.slice(i, i + 100)),
    })
    if (!r.ok) console.log(table, 'chunk fail', r.status, (await r.text()).slice(0, 150))
  }
}

await upsert('categories', catRows, 'mc_id,name,img,sliders,sort')
await upsert('departments', depRows, 'mc_id,name,img,sliders,top_id,top_name')
console.log(JSON.stringify({ categories: catRows.length, departments: depRows.length }))
console.log('sample dep:', JSON.stringify(depRows[0]).slice(0, 220))
