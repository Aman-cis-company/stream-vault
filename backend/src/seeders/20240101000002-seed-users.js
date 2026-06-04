'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const salt = await bcrypt.genSalt(12);

    const adminPassword = await bcrypt.hash('Admin@123456', salt);
    const memberPassword = await bcrypt.hash('Member@123456', salt);
    const subscriberPassword = await bcrypt.hash('Subscriber@123456', salt);

    // Fetch role IDs dynamically
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('super_admin','team_member','subscriber')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleMap = {};
    roles.forEach((r) => { roleMap[r.name] = r.id; });

    await queryInterface.bulkInsert('users', [
      {
        role_id: roleMap['super_admin'],
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@streamvault.com',
        password: adminPassword,
        phone: '+919000000001',
        email_verified: true,
        status: 'active',
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: now,
        updated_at: now,
      },
      {
        role_id: roleMap['team_member'],
        first_name: 'Team',
        last_name: 'Member',
        email: 'member@streamvault.com',
        password: memberPassword,
        phone: '+919000000002',
        email_verified: true,
        status: 'active',
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: now,
        updated_at: now,
      },
      {
        role_id: roleMap['subscriber'],
        first_name: 'John',
        last_name: 'Subscriber',
        email: 'subscriber@streamvault.com',
        password: subscriberPassword,
        phone: '+919000000003',
        email_verified: true,
        status: 'active',
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@streamvault.com', 'member@streamvault.com', 'subscriber@streamvault.com'],
    }, {});
  },
};
