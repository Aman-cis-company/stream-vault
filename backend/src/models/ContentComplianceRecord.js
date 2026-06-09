const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContentComplianceRecord = sequelize.define('ContentComplianceRecord', {
  id:                { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  movie_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  episode_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  performer_name:    { type: DataTypes.STRING(255), allowNull: false },
  stage_names:       { type: DataTypes.TEXT, allowNull: true },
  date_of_birth:     { type: DataTypes.DATEONLY, allowNull: false },
  id_document_type:  { type: DataTypes.STRING(100), allowNull: false },
  id_document_ref:   { type: DataTypes.STRING(255), allowNull: false },
  verified_by:       { type: DataTypes.STRING(255), allowNull: false },
  verified_at:       { type: DataTypes.DATE, allowNull: false },
  custodian_name:    { type: DataTypes.STRING(255), allowNull: false },
  custodian_address: { type: DataTypes.TEXT, allowNull: false },
  notes:             { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'content_compliance_records',
  underscored: true,
  timestamps: true,
});

module.exports = ContentComplianceRecord;
