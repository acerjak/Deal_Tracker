const router = require('express').Router()
const { Deal } = require('../models')

// only fields a client may set; blocks overwriting id/timestamps
const pick = ({ dealName, value, organization, contact, phone, email, notes, stage, userId }) =>
  ({ dealName, value, organization, contact, phone, email, notes, stage, userId })

// GET all deals
router.get('/deals', async (req, res) => {
  res.json(await Deal.findAll())
})
// GET all deals by userId
router.get('/deals/:userId', async (req, res) => {
  res.json(await Deal.findAll({ where: { userId: req.params.userId } }))
})
// GET one deal
router.get('/deal/:id', async (req, res) => {
  const deal = await Deal.findByPk(req.params.id)
  if (!deal) return res.sendStatus(404)
  res.json(deal)
})
// POST one deal
router.post('/deals', async (req, res) => {
  res.json(await Deal.create(pick(req.body)))
})
// PUT one deal
router.put('/deal/:id', async (req, res) => {
  await Deal.update(pick(req.body), { where: { id: req.params.id } })
  res.sendStatus(200)
})
// PUT deal stage (used by drag and drop)
router.put('/deals/:id/:status', async (req, res) => {
  await Deal.update({ stage: req.params.status }, { where: { id: req.params.id } })
  res.sendStatus(200)
})
// DELETE one deal
router.delete('/deal/:id', async (req, res) => {
  await Deal.destroy({ where: { id: req.params.id } })
  res.sendStatus(200)
})

module.exports = router
