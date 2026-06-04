'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'stripe_session_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'stripe_payment_intent_id',
    });
    await queryInterface.addIndex('payments', ['stripe_session_id'], {
      name: 'payments_stripe_session_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('payments', 'payments_stripe_session_id');
    await queryInterface.removeColumn('payments', 'stripe_session_id');
  },
};
