'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ['movies', 'episodes'];
    const columns = ['intro_start', 'intro_end', 'recap_start', 'recap_end'];
    
    for (const table of tables) {
      for (const col of columns) {
        try {
          await queryInterface.addColumn(table, col, {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
          });
        } catch (e) {
          // Column might already exist
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = ['movies', 'episodes'];
    const columns = ['intro_start', 'intro_end', 'recap_start', 'recap_end'];
    
    for (const table of tables) {
      for (const col of columns) {
        try {
          await queryInterface.removeColumn(table, col);
        } catch (e) {
          // Ignore if error
        }
      }
    }
  }
};
