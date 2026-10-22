require('dotenv').config()
const url = process.env.TEST_DATABASE_URL
// tests drop and recreate tables, so refuse to run against anything that isn't clearly a test database
if (!url || url.includes('change-me') || !/_test(\?|$)/.test(url)) throw new Error('Set TEST_DATABASE_URL to a database whose name ends in _test')
process.env.LOCAL_URL = url
delete process.env.DATABASE_URL
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-secret'

const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { app, sessionStore, sequelize } = require('../app')
require('../models')

let server, base
before(async () => {
  await sequelize.sync({ force: true })
  await sessionStore.sync({ force: true })
  server = app.listen(0)
  base = `http://127.0.0.1:${server.address().port}`
})
after(async () => {
  server.close()
  await sequelize.close()
})

// minimal client that keeps a cookie jar per "browser"
const client = () => {
  let cookie = ''
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined
    })
    const set = res.headers.getSetCookie().find(c => c.startsWith('connect.sid='))
    if (set) cookie = set.split(';')[0]
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = text }
    return { status: res.status, body: json, headers: res.headers, text }
  }
}
const signUp = async (name, email, password = 'correct horse') => {
  const c = client()
  const r = await c('POST', '/api/auth/register', { name, email, password })
  assert.equal(r.status, 201)
  return c
}

test('register logs in, /me works, hash never leaks', async () => {
  const c = await signUp('Ann', 'Ann@Example.com')
  const me = await c('GET', '/api/auth/me')
  assert.equal(me.status, 200)
  assert.equal(me.body.email, 'ann@example.com')
  assert.ok(!/passwordHash|\$2[aby]\$/.test(me.text))
})

test('register rejects duplicates, bad email and bad passwords', async () => {
  const c = client()
  const dup = await c('POST', '/api/auth/register', { name: 'Ann2', email: 'ann@example.com', password: 'correct horse' })
  assert.equal(dup.status, 409)
  assert.equal((await c('POST', '/api/auth/register', { name: 'x', email: 'nope', password: 'correct horse' })).status, 400)
  assert.equal((await c('POST', '/api/auth/register', { name: 'x', email: 'x@example.com', password: 'short' })).status, 400)
  assert.equal((await c('POST', '/api/auth/register', { name: 'x', email: 'x@example.com', password: 'a'.repeat(73) })).status, 400)
  assert.equal((await c('POST', '/api/auth/register', { name: 'x', email: 'x@example.com', password: ['a', 'b'] })).status, 400)
})

test('login: right password works, wrong password and unknown email look identical', async () => {
  const c = client()
  const bad = await c('POST', '/api/auth/login', { email: 'ann@example.com', password: 'wrong password' })
  const unknown = await c('POST', '/api/auth/login', { email: 'nobody@example.com', password: 'wrong password' })
  assert.equal(bad.status, 401)
  assert.deepEqual(bad.body, unknown.body)
  assert.equal((await c('POST', '/api/auth/login', { email: 'ann@example.com' })).status, 401)
  const ok = await c('POST', '/api/auth/login', { email: ' ANN@example.com ', password: 'correct horse' })
  assert.equal(ok.status, 200)
  assert.equal((await c('GET', '/api/auth/me')).status, 200)
})

test('login issues a new session id (no fixation)', async () => {
  const c = client()
  await c('GET', '/api/auth/me')
  const a = await c('POST', '/api/auth/login', { email: 'ann@example.com', password: 'correct horse' })
  const b = await client()('POST', '/api/auth/login', { email: 'ann@example.com', password: 'correct horse' })
  assert.notEqual(a.headers.getSetCookie()[0], b.headers.getSetCookie()[0])
})

test('logout ends the session', async () => {
  const c = await signUp('Lou', 'lou@example.com')
  assert.equal((await c('POST', '/api/auth/logout')).status, 204)
  assert.equal((await c('GET', '/api/auth/me')).status, 401)
  assert.equal((await c('GET', '/api/deals')).status, 401)
})

test('logged-out requests cannot touch any deal route', async () => {
  const c = client()
  for (const [m, p] of [['GET', '/api/deals'], ['GET', '/api/deal/1'], ['POST', '/api/deals'], ['PUT', '/api/deal/1'], ['PUT', '/api/deals/1/Won'], ['DELETE', '/api/deal/1']]) {
    assert.equal((await c(m, p, {})).status, 401, `${m} ${p}`)
  }
})

test('the old open user routes are gone', async () => {
  const c = await signUp('Old', 'old@example.com')
  for (const p of ['/api/users', '/api/users/1', '/api/login/Ann']) {
    assert.equal((await c('GET', p)).status, 404, p)
  }
})

test('deals page redirects when logged out, serves when logged in', async () => {
  const out = await client()('GET', '/deals.html')
  assert.equal(out.status, 302)
  assert.equal(out.headers.get('location'), '/')
  const c = await signUp('Pat', 'pat@example.com')
  assert.equal((await c('GET', '/deals.html')).status, 200)
  // and the sign-in page sends signed-in visitors on to their deals
  const home = await c('GET', '/')
  assert.equal(home.status, 302)
  assert.equal(home.headers.get('location'), '/deals.html')
})

test('users cannot see or change each other\'s deals', async () => {
  const a = await signUp('A', 'a@example.com')
  const b = await signUp('B', 'b@example.com')
  const mine = await a('POST', '/api/deals', { dealName: 'secret', value: 10 })
  assert.equal(mine.status, 201)
  const id = mine.body.id

  assert.equal((await b('GET', `/api/deal/${id}`)).status, 404)
  assert.equal((await b('PUT', `/api/deal/${id}`, { dealName: 'hacked' })).status, 404)
  assert.equal((await b('PUT', `/api/deals/${id}/Won`)).status, 404)
  assert.equal((await b('DELETE', `/api/deal/${id}`)).status, 404)
  assert.deepEqual((await b('GET', '/api/deals')).body, [])

  const still = await a('GET', `/api/deal/${id}`)
  assert.equal(still.body.dealName, 'secret')
  assert.equal(still.body.stage, 'Lead')
})

test('a client cannot choose the owner of a deal', async () => {
  const a = await signUp('C', 'c@example.com')
  const me = (await a('GET', '/api/auth/me')).body
  const made = await a('POST', '/api/deals', { dealName: 'x', value: 1, userId: 99999 })
  assert.equal(made.body.userId, me.id)
  const moved = await a('PUT', `/api/deal/${made.body.id}`, { dealName: 'y', userId: 99999 })
  assert.equal(moved.status, 200)
  assert.equal((await a('GET', `/api/deal/${made.body.id}`)).body.userId, me.id)
})

test('owner can edit, move and delete; bad stage rejected', async () => {
  const a = await signUp('D', 'd@example.com')
  const { body: { id } } = await a('POST', '/api/deals', { dealName: 'x', value: 1 })
  assert.equal((await a('PUT', `/api/deal/${id}`, { dealName: 'renamed' })).status, 200)
  assert.equal((await a('PUT', `/api/deals/${id}/Won`)).status, 200)
  assert.equal((await a('PUT', `/api/deals/${id}/Loss`)).status, 200)
  assert.equal((await a('PUT', `/api/deals/${id}/Won`)).status, 200)
  assert.equal((await a('PUT', `/api/deals/${id}/Bogus`)).status, 400)
  assert.deepEqual((await a('GET', `/api/deal/${id}`)).body.stage, 'Won')
  assert.equal((await a('DELETE', `/api/deal/${id}`)).status, 200)
  assert.equal((await a('GET', `/api/deal/${id}`)).status, 404)
})

test('CSP blocks inline scripts and handlers', async () => {
  const csp = (await client()('GET', '/')).headers.get('content-security-policy')
  assert.match(csp, /script-src 'self' https:\/\/cdnjs\.cloudflare\.com https:\/\/unpkg\.com/)
  assert.match(csp, /script-src-attr 'none'/)
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/)
})

test('health check works without a session or database', async () => {
  const r = await client()('GET', '/healthz')
  assert.equal(r.status, 200)
})

test('demo: one click gives a private account with sample deals in every stage', async () => {
  const a = client()
  const made = await a('POST', '/api/auth/demo')
  assert.equal(made.status, 201)
  assert.match(made.body.email, /@demo\.invalid$/)
  const deals = (await a('GET', '/api/deals')).body
  assert.deepEqual([...new Set(deals.map(d => d.stage))].sort(), ['Contacted', 'Lead', 'Loss', 'Proposal', 'Qualified', 'Won'])
  // a second visitor gets their own copy and cannot see the first one's
  const b = client()
  await b('POST', '/api/auth/demo')
  const bDeals = (await b('GET', '/api/deals')).body
  assert.equal(bDeals.some(d => deals.some(x => x.id === d.id)), false)
  assert.equal((await b('GET', `/api/deal/${deals[0].id}`)).status, 404)
})

test('demo: accounts older than a day are swept with their deals', async () => {
  const { User, Deal } = require('../models')
  const a = client()
  const old = (await a('POST', '/api/auth/demo')).body
  await sequelize.query('UPDATE users SET createdAt = ? WHERE id = ?', { replacements: [new Date(Date.now() - 25 * 3600 * 1000), old.id] })
  await client()('POST', '/api/auth/demo')
  assert.equal(await User.count({ where: { id: old.id } }), 0)
  assert.equal(await Deal.count({ where: { userId: old.id } }), 0)
})

test('demo: capped, and the reserved domain cannot be registered', async () => {
  const { User } = require('../models')
  process.env.MAX_DEMO_USERS = '1'
  const full = await client()('POST', '/api/auth/demo')
  delete process.env.MAX_DEMO_USERS
  assert.equal(full.status, 503)
  const r = await client()('POST', '/api/auth/register', { name: 'x', email: 'sneaky@demo.invalid', password: 'correct horse' })
  assert.equal(r.status, 400)
  assert.equal(await User.count({ where: { email: 'sneaky@demo.invalid' } }), 0)
})

test('sign-ups stop at the user cap but logins still work', async () => {
  const { User } = require('../models')
  const { Op } = require('sequelize')
  const real = await User.count({ where: { email: { [Op.notLike]: '%@demo.invalid' } } })
  process.env.MAX_USERS = String(real)
  const blocked = await client()('POST', '/api/auth/register', { name: 'x', email: 'late@example.com', password: 'correct horse' })
  const login = await client()('POST', '/api/auth/login', { email: 'ann@example.com', password: 'correct horse' })
  delete process.env.MAX_USERS
  assert.equal(blocked.status, 503)
  assert.equal(login.status, 200)
})
