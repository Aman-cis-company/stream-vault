'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      {
        name: 'super_admin',
        description: 'Full platform access — manages users, content, billing and settings.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'team_member',
        description: 'Content management access — can create and edit categories and movies.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'subscriber',
        description: 'Registered viewer with an active or lapsed subscription.',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
