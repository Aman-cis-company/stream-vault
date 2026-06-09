const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AffiliateCode = sequelize.define('AffiliateCode', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  code:         { type: DataTypes.STRING(60), allowNull: false, unique: true },
  total_clicks: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
}, {
  tableName: 'affiliate_codes',
  underscored: true,
  timestamps: true,
});

module.exports = AffiliateCode;
