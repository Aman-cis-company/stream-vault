'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Seed new roles in the `roles` table
    await queryInterface.bulkInsert('roles', [
      {
        name: 'admin',
        description: 'Administrator access — manages content, users and invoices.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'content_manager',
        description: 'Manages movies, episodes and categories.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'finance_manager',
        description: 'Manages invoices, subscriptions, and financial logs.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'affiliate_manager',
        description: 'Manages affiliate codes, conversions, and payouts.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'support_agent',
        description: 'Manages user accounts, verifications, and user support.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 2. Create `permissions` table
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // 3. Create `role_permissions` join table
    await queryInterface.createTable('role_permissions', {
      role_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id',
        },
        onDelete: 'CASCADE',
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

    // Composite primary key
    await queryInterface.addConstraint('role_permissions', {
      fields: ['role_id', 'permission_id'],
      type: 'primary key',
      name: 'pk_role_permissions',
    });

    // 4. Create `activity_logs` table
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
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

    // 5. Add invitation columns to `users` table
    await queryInterface.addColumn('users', 'invitation_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'invitation_expiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'invited_by', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    // 6. Seed permissions
    const permissions = [
      { name: 'movies:read', description: 'Can view movies list and details' },
      { name: 'movies:write', description: 'Can create, edit, delete movies' },
      { name: 'episodes:read', description: 'Can view episodes list and details' },
      { name: 'episodes:write', description: 'Can create, edit, delete episodes' },
      { name: 'users:read', description: 'Can view registered users' },
      { name: 'users:write', description: 'Can edit, disable, ban, verify users' },
      { name: 'subscriptions:read', description: 'Can view user subscriptions and plans' },
      { name: 'subscriptions:write', description: 'Can create, edit, delete plans and subscriptions' },
      { name: 'invoices:read', description: 'Can view client invoices' },
      { name: 'invoices:write', description: 'Can generate, update invoices' },
      { name: 'affiliates:read', description: 'Can view affiliate performance' },
      { name: 'affiliates:write', description: 'Can edit affiliate codes or payouts' },
      { name: 'reports:read', description: 'Can view dashboard statistics and financial reports' },
      { name: 'settings:read', description: 'Can view system/compliance settings' },
      { name: 'settings:write', description: 'Can update system/compliance settings' },
      { name: 'team:read', description: 'Can view team members' },
      { name: 'team:write', description: 'Can invite, edit, enable/disable, delete team members' },
    ];

    await queryInterface.bulkInsert('permissions', permissions.map(p => ({
      ...p,
      created_at: now,
      updated_at: now,
    })));

    // Get seeded role and permission records
    const [roles] = await queryInterface.sequelize.query('SELECT id, name FROM roles');
    const [perms] = await queryInterface.sequelize.query('SELECT id, name FROM permissions');

    const roleMap = Object.fromEntries(roles.map(r => [r.name, r.id]));
    const permMap = Object.fromEntries(perms.map(p => [p.name, p.id]));

    // Construct role-permission mapping insertions
    const rpInsertions = [];

    // Helper to add permissions to a role
    const grant = (roleName, permList) => {
      const roleId = roleMap[roleName];
      if (!roleId) return;
      for (const pName of permList) {
        const permId = permMap[pName];
        if (permId) {
          rpInsertions.push({
            role_id: roleId,
            permission_id: permId,
            created_at: now,
            updated_at: now,
          });
        }
      }
    };

    // Super Admin: gets EVERYTHING
    grant('super_admin', Object.keys(permMap));

    // Admin: gets everything except team management
    grant('admin', Object.keys(permMap).filter(p => !p.startsWith('team:')));

    // Content Manager
    grant('content_manager', [
      'movies:read', 'movies:write',
      'episodes:read', 'episodes:write',
      'reports:read',
    ]);

    // Finance Manager
    grant('finance_manager', [
      'subscriptions:read',
      'invoices:read', 'invoices:write',
      'reports:read',
    ]);

    // Affiliate Manager
    grant('affiliate_manager', [
      'affiliates:read', 'affiliates:write',
      'reports:read',
    ]);

    // Support Agent
    grant('support_agent', [
      'users:read', 'users:write',
      'reports:read',
    ]);

    if (rpInsertions.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rpInsertions);
    }
  },

  async down(queryInterface) {
    // Drop tables
    await queryInterface.dropTable('activity_logs');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');

    // Remove columns from users
    await queryInterface.removeColumn('users', 'invitation_token');
    await queryInterface.removeColumn('users', 'invitation_expiry');
    await queryInterface.removeColumn('users', 'invited_by');

    // Delete new roles
    await queryInterface.sequelize.query(
      `DELETE FROM roles WHERE name IN ('admin', 'content_manager', 'finance_manager', 'affiliate_manager', 'support_agent')`
    );
  },
};
