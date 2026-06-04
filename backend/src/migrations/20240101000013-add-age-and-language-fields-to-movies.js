'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('movies', 'language', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('movies', 'content_rating', {
      type: Sequelize.ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+'),
      allowNull: true,
    });
    await queryInterface.addColumn('movies', 'is_age_restricted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('movies', 'minimum_age', {
      type: Sequelize.TINYINT.UNSIGNED,
      allowNull: true,
      comment: 'Minimum age in years required to watch this movie',
    });
    await queryInterface.addColumn('movies', 'warning_flags_json', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Array of content warnings: violence, strong_language, mature_themes, nudity',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('movies', 'language');
    await queryInterface.removeColumn('movies', 'content_rating');
    await queryInterface.removeColumn('movies', 'is_age_restricted');
    await queryInterface.removeColumn('movies', 'minimum_age');
    await queryInterface.removeColumn('movies', 'warning_flags_json');
    await queryInterface.sequelize.query("ALTER TABLE movies DROP INDEX content_rating;").catch(() => {});
  },
};
