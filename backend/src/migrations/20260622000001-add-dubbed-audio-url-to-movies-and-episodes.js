'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('movies', 'dubbed_audio_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('episodes', 'dubbed_audio_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('movies', 'dubbed_audio_url');
    await queryInterface.removeColumn('episodes', 'dubbed_audio_url');
  }
};
