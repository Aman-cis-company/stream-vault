'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('subscription_plans', [
      {
        name: 'Standard Monthly',
        description: 'Perfect for casual viewers. Full HD streaming, watch on 1 device.',
        price: 299.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        stripe_price_id: null,
        features_json: JSON.stringify([
          'Full HD (1080p) streaming',
          'Unlimited movies & shows',
          '1 screen at a time',
          'Download up to 10 titles',
          'Ad-free experience',
        ]),
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Premium Quarterly',
        description: 'Great value for regular viewers. 4K streaming, watch on 2 devices.',
        price: 749.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        stripe_price_id: null,
        features_json: JSON.stringify([
          '4K Ultra HD streaming',
          'Unlimited movies & shows',
          '2 screens simultaneously',
          'Download up to 25 titles',
          'Ad-free experience',
          'Early access to new releases',
        ]),
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Cinephile Yearly',
        description: 'The ultimate plan for true cinema lovers. Best value, all features unlocked.',
        price: 1999.00,
        currency: 'INR',
        billing_cycle: 'yearly',
        stripe_price_id: null,
        features_json: JSON.stringify([
          '4K Ultra HD + HDR streaming',
          'Unlimited movies & shows',
          '4 screens simultaneously',
          'Unlimited downloads',
          'Ad-free experience',
          'Early access to new releases',
          'Exclusive behind-the-scenes content',
          'Priority customer support',
        ]),
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('subscription_plans', null, {});
  },
};
