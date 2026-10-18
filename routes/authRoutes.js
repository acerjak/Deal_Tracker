const router = require('express').Router()
const bcrypt = require('bcrypt')
const { promisify } = require('util')
const rateLimit = require('express-rate-limit')
const { Op } = require('sequelize')
const { User } = require('../models')
const { demoOnly, isDemoEmail, sweepDemoUsers, createDemoUser } = require('../lib/demo')

// caps keep a public free-tier database from filling up; read at request time so tests can change them
const maxUsers = () => Number(process.env.MAX_USERS) || 500
const maxDemoUsers = () => Number(process.env.MAX_DEMO_USERS) || 100

const ROUNDS = 12
// compared against when the email is unknown, so timing doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', ROUNDS)

const limit = (windowMs, max) => rateLimit({
  windowMs, limit: max, standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many attempts, try again later' }
})

// bcrypt only uses the first 72 bytes, so cap there instead of silently truncating
const validPassword = pw => typeof pw === 'string' && pw.length >= 8 && Buffer.byteLength(pw) <= 72

// new session id on every login/register prevents session fixation
const startSession = async (req, user) => {
  await promisify(req.session.regenerate.bind(req.session))()
  req.session.userId = user.id
}

router.post('/auth/register', limit(60 * 60 * 1000, 20), async (req, res) => {
  const { name, email, password } = req.body
  if (!validPassword(password)) {
    return res.status(400).json({ error: 'Password must be 8 to 72 characters' })
  }
  if (isDemoEmail(email)) return res.status(400).json({ error: 'That email domain is reserved' })
  if (await User.count({ where: { [Op.not]: demoOnly } }) >= maxUsers()) {
    return res.status(503).json({ error: 'Sign-ups are full right now. Try the demo instead.' })
  }
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, ROUNDS) })
  await startSession(req, user)
  res.status(201).json(user)
})

// one-click demo: a throwaway account with sample deals, so visitors never share data
router.post('/auth/demo', limit(60 * 60 * 1000, 10), async (req, res) => {
  await sweepDemoUsers()
  if (await User.count({ where: demoOnly }) >= maxDemoUsers()) {
    return res.status(503).json({ error: 'The demo is busy right now. Please try again later.' })
  }
  const user = await createDemoUser()
  await startSession(req, user)
  res.status(201).json(user)
})

router.post('/auth/login', limit(15 * 60 * 1000, 10), async (req, res) => {
  const { email, password } = req.body
  const user = typeof email === 'string' && typeof password === 'string'
    ? await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } })
    : null
  const ok = await bcrypt.compare(typeof password === 'string' ? password : '', user ? user.passwordHash : DUMMY_HASH)
  if (!user || !ok) return res.status(401).json({ error: 'Incorrect email or password' })
  await startSession(req, user)
  res.json(user)
})

router.post('/auth/logout', async (req, res) => {
  await promisify(req.session.destroy.bind(req.session))()
  res.clearCookie('connect.sid')
  res.sendStatus(204)
})

router.get('/auth/me', async (req, res) => {
  const user = req.session.userId && await User.findByPk(req.session.userId)
  if (!user) return res.status(401).json({ error: 'Not logged in' })
  res.json(user)
})

module.exports = router
