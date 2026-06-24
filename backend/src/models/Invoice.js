const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  invoice_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  subscription_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  payment_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  stripe_invoice_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  stripe_payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('paid', 'unpaid', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'unpaid',
  },
  invoice_pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  issued_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'invoices',
  underscored: true,
  timestamps: true,
});

module.exports = Invoice;
