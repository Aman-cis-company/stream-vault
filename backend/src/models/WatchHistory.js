const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WatchHistory = sequelize.define('WatchHistory', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  movie_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  episode_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  watch_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Watch time in seconds',
  },
  completion_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },
  last_watched_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'watch_history',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_watch_history_user_movie',
      fields: ['user_id', 'movie_id'],
    },
    {
      name: 'idx_watch_history_user_episode',
      fields: ['user_id', 'episode_id'],
    },
  ],
});

module.exports = WatchHistory;
