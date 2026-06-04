const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSubscription = sequelize.define('UserSubscription', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  plan_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  stripe_customer_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  stripe_subscription_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'user_subscriptions',
  underscored: true,
  timestamps: true,
});

module.exports = UserSubscription;
