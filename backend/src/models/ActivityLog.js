const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('details');
      if (!rawValue) return null;
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    },
    set(value) {
      if (value === null || value === undefined) {
        this.setDataValue('details', null);
      } else {
        this.setDataValue('details', typeof value === 'object' ? JSON.stringify(value) : value);
      }
    },
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  underscored: true,
  timestamps: true,
});

module.exports = ActivityLog;
