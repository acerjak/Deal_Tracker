const router = require('express').Router()
const { User, Deal } = require('../models')

// GET all users
router.get('/users', async (req, res) => {
  res.json(await User.findAll())
})
// GET one user
router.get('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id, { include: [Deal] })
  if (!user) return res.sendStatus(404)
  res.json(user)
})
// POST one user
router.post('/users', async (req, res) => {
  res.json(await User.create({ name: req.body.name }))
})
// PUT one user
router.put('/users/:id', async (req, res) => {
  await User.update({ name: req.body.name }, { where: { id: req.params.id } })
  res.sendStatus(200)
})
// DELETE one user
router.delete('/users/:id', async (req, res) => {
  await User.destroy({ where: { id: req.params.id } })
  res.sendStatus(200)
})
// Log In one user
router.get('/login/:name', async (req, res) => {
  const user = await User.findOne({ where: { name: req.params.name } })
  if (!user) return res.sendStatus(404)
  res.json(user)
})

module.exports = router
