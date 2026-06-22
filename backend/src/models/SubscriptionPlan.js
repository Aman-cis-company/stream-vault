const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false,
  },
  stripe_price_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  features_json: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  quality: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '1080p',
  },
  max_screens: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'subscription_plans',
  underscored: true,
  timestamps: true,
});

module.exports = SubscriptionPlan;
