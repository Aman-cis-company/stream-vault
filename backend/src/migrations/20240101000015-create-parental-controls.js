'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('parental_controls', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      pin_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      pin_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      hide_restricted_content: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      max_rating: {
        type: Sequelize.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'),
        allowNull: true,
        comment: 'Maximum allowed content rating. NULL means no restriction.',
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

    await queryInterface.addIndex('parental_controls', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('parental_controls');
  },
};
