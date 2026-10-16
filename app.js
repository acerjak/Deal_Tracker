require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const session = require('express-session')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const { join } = require('path')
const sequelize = require('./connections')
const { requirePage } = require('./middleware/requireAuth')

if (!process.env.SESSION_SECRET) {
  throw new Error('Set SESSION_SECRET (a long random string) in your environment or .env file')
}

const app = express()
const isProd = process.env.NODE_ENV === 'production'

// behind a proxy (e.g. Heroku/Render) so secure cookies and rate limiting see the real client
if (isProd) app.set('trust proxy', 1)

// CSP is off for now: the pages use inline handlers and CDN scripts; revisit in the UI pass
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json())

const sessionStore = new SequelizeStore({ db: sequelize, tableName: 'sessions' })
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 1000 * 60 * 60 * 24 * 7 }
}))

// the deals page requires a session; must come before static file serving
app.get(['/deals', '/deals.html'], requirePage)
app.use(express.static(join(__dirname, 'public')))

app.use(require('./routes'))

// central error handler for failures in async route handlers
app.use((err, req, res, next) => {
  const name = err.name || ''
  if (name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'An account with that email already exists' })
  if (name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') })
  if (name === 'SequelizeForeignKeyConstraintError') return res.status(400).json({ error: 'Unknown user' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' })
  console.error(err)
  res.status(err.status || 500).json({ error: 'Server error' })
})

module.exports = { app, sessionStore, sequelize }
