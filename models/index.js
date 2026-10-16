const User = require('./User.js')
const Deal = require('./Deal.js')

// a user has many deals; a deal always belongs to a user
User.hasMany(Deal, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' })
Deal.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false } })

module.exports = { User, Deal }
