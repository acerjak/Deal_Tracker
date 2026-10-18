const { Model, DataTypes } = require('sequelize')
const sequelize = require('../connections')

class User extends Model {
  // never serialize the password hash
  toJSON() {
    const { passwordHash, ...safe } = this.get()
    return safe
  }
}

User.init({
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    set(v) { this.setDataValue('name', typeof v === 'string' ? v.trim() : v) },
    validate: { notEmpty: true }
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    set(v) { this.setDataValue('email', typeof v === 'string' ? v.trim().toLowerCase() : v) },
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING(60),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'user',
  defaultScope: { attributes: { exclude: ['passwordHash'] } },
  scopes: { withPassword: { attributes: { include: ['passwordHash'] } } }
})

module.exports = User
