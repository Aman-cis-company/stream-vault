const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserInteraction = sequelize.define('UserInteraction', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  content_type: { type: DataTypes.ENUM('movie', 'series'), allowNull: false },
  content_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  is_liked: { type: DataTypes.BOOLEAN, defaultValue: false },
  in_list: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'user_interactions',
  underscored: true,
  timestamps: true,
  indexes: [
    { unique: true, fields: ['user_id', 'content_type', 'content_id'], name: 'uq_user_content' },
  ],
});

module.exports = UserInteraction;
