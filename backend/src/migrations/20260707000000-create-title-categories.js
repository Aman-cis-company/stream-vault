'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create movie_categories junction table
    await queryInterface.createTable('movie_categories', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      movie_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'movies', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create series_categories junction table
    await queryInterface.createTable('series_categories', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      series_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'series', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add unique indexes to prevent duplicate relations
    await queryInterface.addIndex('movie_categories', ['movie_id', 'category_id'], {
      unique: true,
      name: 'movie_categories_movie_id_category_id_unique',
    });
    await queryInterface.addIndex('series_categories', ['series_id', 'category_id'], {
      unique: true,
      name: 'series_categories_series_id_category_id_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('movie_categories');
    await queryInterface.dropTable('series_categories');
  },
};
