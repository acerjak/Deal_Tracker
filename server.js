require('dotenv').config()
const express = require('express')
const { join } = require('path')
const sequelize = require('./connections')

const app = express()
const port = process.env.PORT || 3000

app.use(express.static(join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(require('./routes'))

// central error handler for failures in async route handlers
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message })
})

sequelize
  .sync()
  .then(() => app.listen(port, () => console.log(`http://localhost:${port}`)))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
