// Push CHANGED project files to GitHub via Contents API (skips identical files)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const TOKEN = process.env.GH_TOKEN
const REPO = 'kalsalh23/play-zedan'
const SKIP_DIRS = new Set(['node_modules', 'dist', '.vercel', 'dalya_ref', '.git'])
const SKIP_FILES = new Set(['.env.local', 'analyze.js', 'details.js', 'bills.js', 'recon.js', 'fetch-dalya.js', 'getkeys.js', 'verify-db.js', 'test-api.mjs', 'test-handlers.mjs', 'test-public.js', 'api_details.txt', 'endpoints.json', 'marketcard_collection.json', 'icon_debug.svg', 'package-lock.json', 'mc-register-probe.mjs', 'check-unmapped.mjs', 'diagnose.mjs', 'bundle-check.mjs', 'verify-final.mjs', 'verify-live2.mjs', 'fix-live.mjs', 'fix-alias.mjs', 'fix-alias2.mjs', 'remap-orphans.mjs', 'alias-result.txt', '.mc-temp-token.txt', '.mc-owner-token.txt',
  'mc-design.mjs', 'mc-design2.mjs', 'mc-design.txt', 'probe-sections.mjs', 'probe-out.txt', 'check-deps.mjs', 'check-deps2.mjs', 'deps-out.txt', 'deps2-out.txt', 'login-probe.mjs', 'login-probe2.mjs', 'login2-out.txt', 'sync-tier.mjs', 'sync-tier2.mjs', 'tier-out.txt', 'tier2-out.txt', 'live-check.mjs', 'live-check.txt', 'fix-alias3.mjs', 'content-check.mjs', 'content-check.txt', 'final-check.mjs', 'final-check.txt', 'final2.mjs', 'final2.txt', 'verify-out.txt', 'hero-check.mjs', 'hero-check.txt', 'hero-check2.mjs', 'hero-check2.txt', 'bundle-check.mjs', 'bundle-check.txt', 'alias-owner.mjs', 'alias-owner.txt', 'deploy-out.txt',
  'brand-out.txt', 'check-missing.mjs', 'harvest-departments.mjs', 'harvest-out.txt', 'missing-deps.txt', 'grab-branded.mjs', 'grab-images.mjs', 'hero3.mjs', 'hero3.txt', 'subs-check.mjs', 'subs-check.txt', 'usd-recalc.mjs', 'usd-out.txt', 'branded-sample.png', 'sample-cat-.png', 'sample-cat-slider.png', 'sample-dep-.png', 'test-handlers.mjs.bak',
  'probe2.mjs', 'probe2-out.txt', 'opacity-fix.mjs', 'opacity-fix.txt', 'sheet-live.mjs', 'sheet-live.txt', 'banner-live.mjs', 'banner-live.txt', 'deep-dep.mjs', 'deep-dep.txt', 'dep-diag.mjs', 'dep-diag.txt', 'deploy-final.mjs', 'deploy-final.txt', 'final-all.mjs', 'final-all.txt', 'final3.mjs', 'final3.txt', 'arabic-test.mjs', 'arabic-test.png', 'debug-banner.mjs', 'cat-probe.mjs', 'cat-probe.txt', 'build-hierarchy.mjs', 'parent-out.txt', 'harvest-recursive.mjs', 'harvest2-out.txt', 'sections-probe.mjs', 'sections-out.txt', 'sections2.mjs', 'sections2-out.txt'])

// files previously pushed by mistake — remove from the repo
const REPO_JUNK = ['brand-out.txt', 'check-missing.mjs', 'grab-branded.mjs', 'grab-images.mjs', 'harvest-departments.mjs', 'harvest-out.txt', 'hero3.mjs', 'hero3.txt', 'missing-deps.txt', 'sample-cat-.png', 'sample-cat-slider.png', 'sample-dep-.png', 'probe2.mjs', 'deep-dep.mjs', 'deep-dep.txt', 'dep-diag.mjs', 'dep-diag.txt', 'deploy-final.mjs', 'deploy-final.txt', 'final-all.mjs', 'final-all.txt', 'final3.mjs', 'final3.txt', 'opacity-fix.mjs', 'opacity-fix.txt', 'sheet-live.mjs', 'sheet-live.txt', 'banner-live.mjs', 'banner-live.txt', 'cat-probe.mjs', 'cat-probe.txt', 'build-hierarchy.mjs', 'parent-out.txt', 'harvest-recursive.mjs', 'harvest2-out.txt', 'sections-probe.mjs', 'sections-out.txt', 'sections2.mjs', 'sections2-out.txt', 'probe2-out.txt']

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
console.log('files scanned:', files.length)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// delete junk previously pushed
for (const j of REPO_JUNK) {
  try {
    const g = await fetch(`https://api.github.com/repos/${REPO}/contents/${j}`, { headers: { Authorization: 'token ' + TOKEN, 'User-Agent': 'push-bot' } })
    if (g.ok) {
      const sha = (await g.json()).sha
      const d = await fetch(`https://api.github.com/repos/${REPO}/contents/${j}`, {
        method: 'DELETE',
        headers: { Authorization: 'token ' + TOKEN, 'User-Agent': 'push-bot', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'cleanup: remove diagnostic file', sha }),
      })
      console.log(d.ok ? 'deleted:' + j : 'delete fail:' + j + ' ' + d.status)
      await sleep(150)
    }
  } catch {}
}

let pushed = 0, skipped = 0, failed = []
for (const f of files) {
  const content = readFileSync(f)
  const b64 = content.toString('base64')
  // existing file (sha + content compare)
  let sha, same = false
  try {
    const g = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(f).replace(/%2F/g, '/')}`, {
      headers: { Authorization: 'token ' + TOKEN, 'User-Agent': 'push-bot' },
    })
    if (g.ok) {
      const j = await g.json()
      sha = j.sha
      same = j.content && j.content.replace(/\n/g, '') === b64
    }
  } catch {}
  if (same) { skipped++; continue }
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(f).replace(/%2F/g, '/')}`, {
    method: 'PUT',
    headers: { Authorization: 'token ' + TOKEN, 'User-Agent': 'push-bot', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'MOBILY BRO+: update ' + f, content: b64, ...(sha ? { sha } : {}) }),
  })
  if (res.ok) { pushed++; console.log('pushed:', f) }
  else failed.push(f + ' -> ' + res.status + ' ' + (await res.text()).slice(0, 100))
  await sleep(150)
}
console.log(`pushed: ${pushed}, unchanged skipped: ${skipped}`)
if (failed.length) { console.log('FAILED:', failed.length); failed.slice(0, 8).forEach((f) => console.log(' -', f)) }
