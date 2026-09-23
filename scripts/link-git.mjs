const VT = process.env.VERCEL_TOKEN
const V = 'https://api.vercel.com'
const TEAM = 'team_grBXAnvjNcx41kaOltdI7yQg'
const withTeam = (p) => p + (p.includes('?') ? '&' : '?') + 'teamId=' + TEAM
const GH_TOKEN = process.env.GH_TOKEN

async function api(path, method = 'GET', body = null) {
  const r = await fetch(V + withTeam(path), {
    method,
    headers: { Authorization: 'Bearer ' + VT, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await r.text()
  console.log(method, path.split('?')[0], '->', r.status, t.slice(0, 200))
  if (!r.ok) throw new Error(t.slice(0, 300))
  try { return JSON.parse(t) } catch { return t }
}

(async () => {
  const gh = await fetch('https://api.github.com/repos/kalsalh23/play-zedan', { headers: { Authorization: 'token ' + GH_TOKEN, 'User-Agent': 'bot' } }).then((r) => r.json())
  await api('/v10/projects/prj_Bg3hvur6FOsCxOTNNyMvAp6lpkzB/link', 'POST', {
    type: 'github',
    repo: 'kalsalh23/play-zedan',
    repoId: gh.id,
    gitForkProtection: false,
    productionBranch: 'main',
  })
  console.log('GIT LINK DONE')
})().catch((e) => console.error('FATAL', String(e).slice(0, 300)))
