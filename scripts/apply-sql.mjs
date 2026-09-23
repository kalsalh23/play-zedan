// Applies SQL files to Supabase via the Management API.
// Usage: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-sql.mjs file1.sql file2.sql
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

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
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN')
  process.exit(1)
}
const ref = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!ref) {
  console.error('Cannot resolve project ref from VITE_SUPABASE_URL')
  process.exit(1)
}

const files = process.argv.slice(2)
for (const f of files) {
  const sql = readFileSync(resolve(f), 'utf8')
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  console.log(`=== ${f} -> HTTP ${res.status} ===`)
  if (!res.ok) {
    console.error(body.slice(0, 5000))
    process.exit(1)
  }
  if (body && body !== '[]') console.log(body.slice(0, 1200))
}
console.log('DONE')
