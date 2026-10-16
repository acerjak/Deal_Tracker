const { app, sessionStore, sequelize } = require('./app')
const port = process.env.PORT || 3000

sequelize
  .sync(process.env.DB_SYNC_ALTER === 'true' ? { alter: true } : {})
  .then(() => sessionStore.sync())
  .then(() => app.listen(port, () => console.log(`http://localhost:${port}`)))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
