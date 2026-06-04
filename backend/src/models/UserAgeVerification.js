const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserAgeVerification = sequelize.define('UserAgeVerification', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  verified_age: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'user_age_verifications',
  underscored: true,
  timestamps: true,
});

module.exports = UserAgeVerification;
