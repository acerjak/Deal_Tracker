const router = require('express').Router()
const { Deal } = require('../models')
const { requireAuth } = require('../middleware/requireAuth')

router.use(requireAuth)

// only fields a client may set; userId always comes from the session, never the client
const pick = ({ dealName, value, organization, contact, phone, email, notes, stage }) =>
  ({ dealName, value, organization, contact, phone, email, notes, stage })

// every query is scoped to the logged-in user; other people's deals look like they don't exist
const mine = (req, id) => ({ id, userId: req.session.userId })

// GET all of my deals
router.get('/deals', async (req, res) => {
  res.json(await Deal.findAll({ where: { userId: req.session.userId } }))
})
// GET one deal
router.get('/deal/:id', async (req, res) => {
  const deal = await Deal.findOne({ where: mine(req, req.params.id) })
  if (!deal) return res.sendStatus(404)
  res.json(deal)
})
// POST one deal
router.post('/deals', async (req, res) => {
  res.status(201).json(await Deal.create({ ...pick(req.body), userId: req.session.userId }))
})
// PUT one deal
router.put('/deal/:id', async (req, res) => {
  const [count] = await Deal.update(pick(req.body), { where: mine(req, req.params.id) })
  res.sendStatus(count ? 200 : 404)
})
// PUT deal stage (used by drag and drop)
router.put('/deals/:id/:status', async (req, res) => {
  if (!Deal.STAGES.includes(req.params.status)) return res.status(400).json({ error: 'Invalid stage' })
  const [count] = await Deal.update({ stage: req.params.status }, { where: mine(req, req.params.id) })
  res.sendStatus(count ? 200 : 404)
})
// DELETE one deal
router.delete('/deal/:id', async (req, res) => {
  const count = await Deal.destroy({ where: mine(req, req.params.id) })
  res.sendStatus(count ? 200 : 404)
})

module.exports = router
