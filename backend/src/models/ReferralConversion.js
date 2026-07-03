const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReferralConversion = sequelize.define('ReferralConversion', {
  id:                { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  affiliate_code_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  referred_user_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  payment_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  commission_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  commission_rate:   { type: DataTypes.DECIMAL(5, 4), defaultValue: 0.1000 },
  status:            { type: DataTypes.ENUM('pending', 'confirmed', 'paid'), defaultValue: 'pending' },
}, {
  tableName: 'referral_conversions',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_referral_conversions_affiliate_status',
      fields: ['affiliate_code_id', 'status'],
    },
  ],
});

module.exports = ReferralConversion;
