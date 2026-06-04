'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('watch_history', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      movie_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'movies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      watch_time: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      completion_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
      },
      last_watched_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('watch_history', ['user_id', 'movie_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('watch_history');
  },
};
