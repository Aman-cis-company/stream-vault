const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Series = sequelize.define('Series', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(300), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
  language: { type: DataTypes.STRING(100), allowNull: true },
  content_rating: { type: DataTypes.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'), allowNull: true },
  is_age_restricted: { type: DataTypes.BOOLEAN, defaultValue: false },
  minimum_age: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
  warning_flags_json: { type: DataTypes.JSON, allowNull: true },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.DECIMAL(3, 1), allowNull: true, defaultValue: null },
  status: { type: DataTypes.ENUM('published', 'draft', 'archived'), defaultValue: 'draft' },
  total_seasons: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 1 },
  release_date: { type: DataTypes.DATEONLY, allowNull: true },
  created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  tableName: 'series',
  underscored: true,
  timestamps: true,
});

module.exports = Series;
