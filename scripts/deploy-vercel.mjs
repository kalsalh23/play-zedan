// Deploy to Vercel via API: create project + link GitHub repo + env vars + production deployment
const VT = process.env.VERCEL_TOKEN
const V = 'https://api.vercel.com'
const TEAM = 'team_grBXAnvjNcx41kaOltdI7yQg'
const withTeam = (p) => p + (p.includes('?') ? '&' : '?') + 'teamId=' + TEAM
const GH_TOKEN = process.env.GH_TOKEN

async function api(path, method = 'GET', body = null, base = V) {
  const r = await fetch(base + withTeam(path), {
    method,
    headers: { Authorization: 'Bearer ' + VT, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text()
  let j
  try { j = JSON.parse(t) } catch { j = t }
  if (!r.ok) throw new Error(`Vercel ${method} ${path} -> ${r.status}: ${JSON.stringify(j).slice(0, 400)}`)
  return j
}

(async () => {
  // 1. create or get project
  let proj
  try {
    proj = await api('/v10/projects', 'POST', { name: 'play-zedan', framework: 'vite' })
    console.log('project created:', proj.id)
  } catch (e) {
    if (String(e).includes('409') || String(e).includes('already')) {
      proj = await api('/v9/projects/play-zedan')
      console.log('project exists:', proj.id)
    } else throw e
  }
  const pid = proj.id

  // 2. link GitHub repo
  if (!proj.link || !proj.link.repoId) {
    const gh = await fetch('https://api.github.com/repos/kalsalh23/play-zedan', { headers: { Authorization: 'token ' + GH_TOKEN, 'User-Agent': 'bot' } }).then((r) => r.json())
    try {
      const linked = await api(`/v10/projects/${pid}/link`, 'POST', { repo: 'kalsalh23/play-zedan', repoId: gh.id, gitForkProtection: false })
      console.log('repo linked:', JSON.stringify(linked).slice(0, 120))
    } catch (e) {
      console.log('link note:', String(e).slice(0, 200))
    }
  } else console.log('repo already linked')

  // 3. env vars
  const envs = [
    ['VITE_SUPABASE_URL', 'https://xwydphvmodofqghyhvxa.supabase.co'],
    ['VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWRwaHZtb2RvZnFnaHlodnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzUwODgsImV4cCI6MjEwNTc1MTA4OH0.TwsH8wnYf_h9j9ZYQQ6mMoXUK43lwR9GaCzqaVZHq4o'],
    ['SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWRwaHZtb2RvZnFnaHlodnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDE3NTA4OCwiZXhwIjoyMTA1NzUxMDg4fQ.L-09n--4rIqN62lscwJDqZAxwKrMT6NFoRDRWsELRQM'],
    ['ADMIN_SECRET', 'mbx_7f4d9a2c51e8b3f6a0d4c8e1b9f2a5c7'],
  ]
  for (const [key, value] of envs) {
    try {
      await api(`/v10/projects/${pid}/env`, 'POST', [{ key, value, type: 'encrypted', target: ['production', 'preview', 'development'] }])
      console.log('env set:', key)
    } catch (e) {
      console.log('env note:', key, String(e).slice(0, 120))
    }
  }

  // 4. production deployment from git
  const gh = await fetch('https://api.github.com/repos/kalsalh23/play-zedan', { headers: { Authorization: 'token ' + GH_TOKEN, 'User-Agent': 'bot' } }).then((r) => r.json())
  const dep = await api('/v13/deployments', 'POST', {
    name: 'play-zedan',
    project: 'play-zedan',
    target: 'production',
    gitSource: { type: 'github', repo: 'kalsalh23/play-zedan', repoId: gh.id, ref: 'main' },
  })
  console.log('deployment started:', dep.id, dep.url)

  // 5. poll until ready
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  let final = null
  for (let i = 0; i < 60; i++) {
    await sleep(10000)
    const d = await api('/v13/deployments/' + dep.id)
    const st = d.readyState
    if (i % 3 === 0) console.log('status:', st, d.buildingAt ? `(building ${Math.round((Date.now() / 1000) - d.buildingAt)}s)` : '')
    if (st === 'READY') { final = d; break }
    if (['ERROR', 'CANCELED'].includes(st)) {
      console.log('BUILD FAILED')
      try {
        const events = await api(`/v3/deployments/${dep.id}/events?limit=100&builds=1`)
        const evs = Array.isArray(events) ? events : events.events || []
        for (const e of evs.slice(-8)) {
          const payload = e.payload || {}
          if (payload.text || payload.errorMessage) console.log('LOG:', (payload.text || payload.errorMessage || '').slice(0, 300))
        }
      } catch (e2) { console.log('log fetch failed:', String(e2).slice(0, 150)) }
      process.exit(1)
    }
  }
  if (!final) { console.log('timeout'); process.exit(1) }
  console.log('DEPLOYED!')
  console.log('url: https://' + (final.alias && final.alias[0] ? final.alias[0] : final.url))
})().catch((e) => { console.error('FATAL:', String(e).slice(0, 600)); process.exit(1) })
