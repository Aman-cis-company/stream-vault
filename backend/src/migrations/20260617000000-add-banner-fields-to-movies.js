'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('movies', 'is_banner', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('movies', 'banner_order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    // Add index to is_banner for optimized lookups
    await queryInterface.addIndex('movies', ['is_banner']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('movies', ['is_banner']);
    await queryInterface.removeColumn('movies', 'is_banner');
    await queryInterface.removeColumn('movies', 'banner_order');
  }
};
