'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create user_profiles table
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'avatar_1',
      },
      profile_type: {
        type: Sequelize.ENUM('adult', 'teen', 'kids'),
        allowNull: false,
        defaultValue: 'adult',
      },
      is_kids: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      max_rating: {
        type: Sequelize.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'),
        allowNull: false,
        defaultValue: '21+',
      },
      pin_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for user_profiles
    await queryInterface.addIndex('user_profiles', ['user_id'], {
      name: 'idx_user_profiles_user_id',
    });

    // 2. Add profile_id column to watch_history
    const watchHistoryTable = await queryInterface.describeTable('watch_history');
    if (!watchHistoryTable.profile_id) {
      await queryInterface.addColumn('watch_history', 'profile_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'user_profiles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      await queryInterface.addIndex('watch_history', ['profile_id'], {
        name: 'idx_watch_history_profile_id',
      });
    }

    // 3. Add profile_id column to user_interactions
    const interactionsTable = await queryInterface.describeTable('user_interactions');
    if (!interactionsTable.profile_id) {
      await queryInterface.addColumn('user_interactions', 'profile_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'user_profiles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      await queryInterface.addIndex('user_interactions', ['profile_id'], {
        name: 'idx_user_interactions_profile_id',
      });
    }
  },

  down: async (queryInterface) => {
    const interactionsTable = await queryInterface.describeTable('user_interactions');
    if (interactionsTable.profile_id) {
      await queryInterface.removeColumn('user_interactions', 'profile_id');
    }

    const watchHistoryTable = await queryInterface.describeTable('watch_history');
    if (watchHistoryTable.profile_id) {
      await queryInterface.removeColumn('watch_history', 'profile_id');
    }

    await queryInterface.dropTable('user_profiles');
  },
};
