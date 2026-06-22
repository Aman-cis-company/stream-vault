'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('subscription_plans');
    if (!tableInfo.quality) {
      await queryInterface.addColumn('subscription_plans', 'quality', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: '1080p',
      });
    }
    if (!tableInfo.max_screens) {
      await queryInterface.addColumn('subscription_plans', 'max_screens', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('subscription_plans');
    if (tableInfo.quality) {
      await queryInterface.removeColumn('subscription_plans', 'quality');
    }
    if (tableInfo.max_screens) {
      await queryInterface.removeColumn('subscription_plans', 'max_screens');
    }
  },
};
