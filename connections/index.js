const Sequelize = require('sequelize')

const url = process.env.JAWSDB_URL || process.env.LOCAL_URL

if (!url) {
  throw new Error('Set JAWSDB_URL or LOCAL_URL (a MySQL connection string) in your environment or .env file')
}

if (url.includes('change-me')) {
  throw new Error('The database URL still has the "change-me" placeholder from .env.example; put in the real password')
}

module.exports = new Sequelize(url, { logging: false })
