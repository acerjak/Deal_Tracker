const router = require('express').Router()
const path = require('path')

router.use('/api', require('./authRoutes.js'))
router.use('/api', require('./dealRoutes.js'))

// unknown API paths are 404s, not the sign-in page
router.use('/api', (req, res) => res.sendStatus(404))

router.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

module.exports = router
