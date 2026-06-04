'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_age_verifications', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      verified_age: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
        comment: 'Age at time of verification',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('user_age_verifications', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_age_verifications');
  },
};
