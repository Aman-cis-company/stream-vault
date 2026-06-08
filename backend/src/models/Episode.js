const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Episode = sequelize.define('Episode', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  series_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  season_number: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
  episode_number: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1 },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
  duration: { type: DataTypes.INTEGER, allowNull: true, comment: 'Duration in seconds' },
  provider_name: { type: DataTypes.STRING(50), defaultValue: 'bunny' },
  provider_video_id: { type: DataTypes.STRING(255), allowNull: true },
  video_url: { type: DataTypes.STRING(500), allowNull: true },
  transcoding_status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), allowNull: true, defaultValue: null },
  status: { type: DataTypes.ENUM('published', 'draft', 'archived'), defaultValue: 'draft' },
  release_date: { type: DataTypes.DATEONLY, allowNull: true },
  created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  tableName: 'episodes',
  underscored: true,
  timestamps: true,
});

module.exports = Episode;
