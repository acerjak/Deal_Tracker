const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { Op } = require('sequelize')
const { User, Deal } = require('../models')

// demo accounts use a reserved, undeliverable domain so they are easy to spot and sweep
const DEMO_DOMAIN = 'demo.invalid'
const DEMO_TTL_MS = 24 * 60 * 60 * 1000
const isDemoEmail = email => typeof email === 'string' && email.trim().toLowerCase().endsWith('@' + DEMO_DOMAIN)
const demoOnly = { email: { [Op.like]: `%@${DEMO_DOMAIN}` } }

const SAMPLE_DEALS = [
  { dealName: 'Website redesign', value: 18000, organization: 'Northwind Traders', contact: 'Priya Shah', email: 'priya@northwind.example', phone: '555-0142', notes: 'Inbound from the spring webinar.', stage: 'Lead' },
  { dealName: 'Annual support plan', value: 7500, organization: 'Bluebird Bakery', contact: 'Sam Ortiz', email: 'sam@bluebird.example', phone: '555-0178', notes: 'Wants a quote by Friday.', stage: 'Lead' },
  { dealName: 'Warehouse analytics', value: 42000, organization: 'Globex Logistics', contact: 'Dana Lee', email: 'dana@globex.example', phone: '555-0119', notes: 'Intro call went well. Send case studies.', stage: 'Contacted' },
  { dealName: 'Team training package', value: 12500, organization: 'Initech', contact: 'Bill Lumbergh', email: 'bill@initech.example', phone: '555-0101', notes: 'Budget approved for Q4.', stage: 'Qualified' },
  { dealName: 'CRM migration', value: 56000, organization: 'Umbrella Health', contact: 'Alice Park', email: 'alice@umbrella.example', phone: '555-0166', notes: 'Proposal sent; legal is reviewing.', stage: 'Proposal' },
  { dealName: 'Retail kiosk rollout', value: 31000, organization: 'Stark Retail', contact: 'Tony Reyes', email: 'tony@stark.example', phone: '555-0133', notes: 'Signed. Kickoff next month.', stage: 'Won' },
  { dealName: 'Pilot program', value: 9000, organization: 'Wayne Foods', contact: 'Bruce Kim', email: 'bruce@wayne.example', phone: '555-0155', notes: 'Went with a competitor on price.', stage: 'Loss' }
]

// remove demo accounts (and their deals) older than a day; done explicitly so it doesn't depend on DB cascade support
async function sweepDemoUsers() {
  const old = await User.findAll({ where: { ...demoOnly, createdAt: { [Op.lt]: new Date(Date.now() - DEMO_TTL_MS) } }, attributes: ['id'] })
  if (!old.length) return 0
  const ids = old.map(u => u.id)
  await Deal.destroy({ where: { userId: ids } })
  return User.destroy({ where: { id: ids } })
}

async function createDemoUser() {
  // nobody ever signs in with this password; it only satisfies the NOT NULL column
  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 4)
  const user = await User.create({
    name: 'Demo Visitor',
    email: `demo-${crypto.randomBytes(6).toString('hex')}@${DEMO_DOMAIN}`,
    passwordHash
  })
  await Deal.bulkCreate(SAMPLE_DEALS.map(d => ({ ...d, userId: user.id })))
  return user
}

module.exports = { DEMO_DOMAIN, demoOnly, isDemoEmail, sweepDemoUsers, createDemoUser }
