const VT = process.env.VERCEL_TOKEN
const V = 'https://api.vercel.com'
async function api(path) {
  const r = await fetch(V + path, { headers: { Authorization: 'Bearer ' + VT } })
  const t = await r.text()
  console.log(path, '->', r.status, t.slice(0, 300))
}
(async () => {
  await api('/v2/user')
  await api('/v2/teams?limit=5')
  await api('/v9/projects?limit=5')
})()
