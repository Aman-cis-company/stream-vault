const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ParentalControl = sequelize.define('ParentalControl', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true,
  },
  pin_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  pin_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  hide_restricted_content: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  max_rating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'),
    allowNull: true,
  },
}, {
  tableName: 'parental_controls',
  underscored: true,
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['pin_hash'] },
  },
  scopes: {
    withPin: { attributes: {} },
  },
});

module.exports = ParentalControl;
