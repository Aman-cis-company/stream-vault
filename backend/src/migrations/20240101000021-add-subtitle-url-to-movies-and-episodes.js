'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('movies', 'subtitle_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('episodes', 'subtitle_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('movies', 'subtitle_url');
    await queryInterface.removeColumn('episodes', 'subtitle_url');
  }
};
