'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_interactions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      content_type: { type: Sequelize.ENUM('movie', 'series'), allowNull: false },
      content_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      is_liked: { type: Sequelize.BOOLEAN, defaultValue: false },
      in_list: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('user_interactions', ['user_id', 'content_type', 'content_id'], {
      unique: true,
      name: 'uq_user_content',
    });
    await queryInterface.addIndex('user_interactions', ['user_id', 'in_list']);
    await queryInterface.addIndex('user_interactions', ['user_id', 'is_liked']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_interactions');
  },
};
