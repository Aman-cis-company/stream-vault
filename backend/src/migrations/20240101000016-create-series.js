'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('series', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      category_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'categories', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(300),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      language: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      content_rating: {
        type: Sequelize.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'),
        allowNull: true,
      },
      is_age_restricted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      minimum_age: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: true,
      },
      warning_flags_json: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('published', 'draft', 'archived'),
        defaultValue: 'draft',
      },
      total_seasons: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 1,
      },
      release_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('series', ['slug']);
    await queryInterface.addIndex('series', ['status']);
    await queryInterface.addIndex('series', ['category_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('series');
  },
};
