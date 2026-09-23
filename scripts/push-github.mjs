// Push project files to GitHub via Contents API (no git needed)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const TOKEN = process.env.GH_TOKEN
const REPO = 'kalsalh23/play-zedan'
const SKIP_DIRS = new Set(['node_modules', 'dist', '.vercel', 'dalya_ref', '.git'])
const SKIP_FILES = new Set(['.env.local', 'analyze.js', 'details.js', 'bills.js', 'recon.js', 'fetch-dalya.js', 'getkeys.js', 'verify-db.js', 'test-api.mjs', 'test-handlers.mjs', 'api_details.txt', 'endpoints.json', 'marketcard_collection.json', 'icon_debug.svg', 'package-lock.json'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_FILES.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out)
    } else out.push(p)
  }
  return out
}

const files = walk(process.cwd()).map((p) => relative(process.cwd(), p).split(sep).join('/'))
console.log('files to push:', files.length)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ok = 0, failed = []
for (const f of files) {
  const content = readFileSync(f)
  const b64 = content.toString('base64')
  // existing file sha (for updates)
  let sha
  const g = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(f).replace(/%2F/g, '/')}`, {
    headers: { Authorization: 'token ' + TOKEN, 'User-Agent': 'push-bot' },
  })
  if (g.ok) { try { sha = (await g.json()).sha } catch {} }
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(f).replace(/%2F/g, '/')}`, {
    method: 'PUT',
    headers: { Authorization: 'token ' + TOKEN, 'User-Agent': 'push-bot', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'MOBILY BRO+ deploy: ' + f,
      content: b64,
      ...(sha ? { sha } : {}),
    }),
  })
  if (res.ok) ok++
  else {
    const t = await res.text()
    failed.push(f + ' -> ' + res.status + ' ' + t.slice(0, 120))
  }
  await sleep(150)
}
console.log('pushed OK:', ok)
if (failed.length) {
  console.log('FAILED:', failed.length)
  failed.slice(0, 10).forEach((f) => console.log(' -', f))
}
