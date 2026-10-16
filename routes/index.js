const router = require('express').Router()
const path = require('path')

router.use('/api', require('./userRoutes.js'))
router.use('/api', require('./dealRoutes.js'))

// serve html from server
router.get('/deals', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/deals.html'))
})
// Express 5 requires a named wildcard
router.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

module.exports = router
