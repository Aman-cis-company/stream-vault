const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Movie = sequelize.define('Movie', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(300),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  provider_name: {
    type: DataTypes.STRING(50),
    defaultValue: 'bunny',
  },
  provider_video_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  video_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  transcoding_status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: true,
    defaultValue: null,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds',
  },
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_banner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  banner_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'archived'),
    defaultValue: 'draft',
  },
  language: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  content_rating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'),
    allowNull: true,
  },
  is_age_restricted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  minimum_age: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
  },
  warning_flags_json: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  subtitle_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null,
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
}, {
  tableName: 'movies',
  underscored: true,
  timestamps: true,
});

module.exports = Movie;
