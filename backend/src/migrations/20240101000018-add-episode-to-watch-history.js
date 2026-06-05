'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Make movie_id nullable — use raw SQL because Sequelize changeColumn
    // does not reliably drop NOT NULL in MySQL when a FK constraint exists.
    await queryInterface.sequelize.query(
      'ALTER TABLE watch_history MODIFY COLUMN movie_id INT UNSIGNED NULL'
    );

    await queryInterface.addColumn('watch_history', 'episode_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'episodes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addIndex('watch_history', ['user_id', 'episode_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('watch_history', ['user_id', 'episode_id']);
    await queryInterface.removeColumn('watch_history', 'episode_id');
    await queryInterface.changeColumn('watch_history', 'movie_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'movies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};
