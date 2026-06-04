'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('categories', 'is_age_restricted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('categories', 'minimum_age', {
      type: Sequelize.TINYINT.UNSIGNED,
      allowNull: true,
      comment: 'Minimum age in years required to access this category',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('categories', 'is_age_restricted');
    await queryInterface.removeColumn('categories', 'minimum_age');
  },
};
