const { Model, DataTypes } = require('sequelize')
const sequelize = require('../connections')

const STAGES = ['Lead', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Loss']

//define what a deal will look like
class Deal extends Model { }
Deal.init({
  dealName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { isInt: true, min: 0 }
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stage: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Lead',
    validate: { isIn: [STAGES] }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize, modelName: 'deal' })

Deal.STAGES = STAGES

module.exports = Deal
