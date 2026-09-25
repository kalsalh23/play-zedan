import { writeFileSync, readFileSync } from 'node:fs'
const out = []
const B = 'https://app.market-card99.com/api/v2'
const TOKEN = readFileSync('.mc-owner-token.txt', 'utf8').trim()

const s = await (await fetch(B + '/sections', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })).json()
const deps = s?.data?.departments || []
out.push('/sections departments: ' + deps.length)
out.push(JSON.stringify(deps.map((d) => ({ id: d.id, name: d.name })), null, 0).slice(0, 1500))

// also check for PES/FIFA anywhere: try /categories list + all top-level again
const cats = (await (await fetch(B + '/categories', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + TOKEN } })).json())?.data?.categories || []
out.push('top categories: ' + cats.map((c) => c.id + ':' + c.name).join(' | '))
writeFileSync('sections-out.txt', out.join('\n'))
