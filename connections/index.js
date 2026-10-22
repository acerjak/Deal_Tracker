const Sequelize = require('sequelize')

const url = process.env.DATABASE_URL || process.env.LOCAL_URL

if (!url) {
  throw new Error('Set DATABASE_URL or LOCAL_URL (a MySQL connection string) in your environment or .env file')
}

if (url.includes('change-me')) {
  throw new Error('The database URL still has the "change-me" placeholder from .env.example; put in the real password')
}

// managed databases (e.g. TiDB Cloud) require an encrypted connection
const ssl = process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined

module.exports = new Sequelize(url, { logging: false, dialectOptions: ssl ? { ssl } : {} })
