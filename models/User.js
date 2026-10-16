const { Model, DataTypes } = require('sequelize')
const sequelize = require('../connections')

class User extends Model { }

//define what a user looks like
User.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(v) { this.setDataValue('name', typeof v === 'string' ? v.trim() : v) },
    validate: { notEmpty: true }
  }
}, { sequelize, modelName: 'user' })

module.exports = User
