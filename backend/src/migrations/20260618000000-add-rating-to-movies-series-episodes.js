'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('movies', 'rating', {
      type: Sequelize.DECIMAL(3, 1),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('series', 'rating', {
      type: Sequelize.DECIMAL(3, 1),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('episodes', 'rating', {
      type: Sequelize.DECIMAL(3, 1),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('movies', 'rating');
    await queryInterface.removeColumn('series', 'rating');
    await queryInterface.removeColumn('episodes', 'rating');
  }
};
