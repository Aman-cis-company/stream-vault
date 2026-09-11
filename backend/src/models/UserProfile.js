const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'avatar_1',
  },
  profile_type: {
    type: DataTypes.ENUM('adult', 'teen', 'kids'),
    allowNull: false,
    defaultValue: 'adult',
  },
  is_kids: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  max_rating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'),
    allowNull: false,
    defaultValue: '21+',
  },
  pin_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'user_profiles',
  underscored: true,
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['pin_hash'] },
  },
  scopes: {
    withPin: { attributes: {} },
  },
});

module.exports = UserProfile;
