'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('movies', 'transcoding_status', {
      type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: true,
      defaultValue: null,
      after: 'video_url',
    });

    await queryInterface.addColumn('episodes', 'transcoding_status', {
      type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: true,
      defaultValue: null,
      after: 'video_url',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('movies', 'transcoding_status');
    await queryInterface.removeColumn('episodes', 'transcoding_status');
  },
};
