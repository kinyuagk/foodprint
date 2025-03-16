'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the table exists
    const tables = await queryInterface.showAllTables();
    const weeklyviewTableExists = tables.includes('foodprint_weeklyview');

    // Add column to `foodprint_weeklyview` if it exists
    if (weeklyviewTableExists) {
      const weeklyviewColumns = await queryInterface.describeTable('foodprint_weeklyview');

      if (!weeklyviewColumns.harvest_image_url) {
        await queryInterface.addColumn('foodprint_weeklyview', 'harvest_image_url', {
          type: Sequelize.STRING,
        });
      }
    } else {
      console.warn('Table `foodprint_weeklyview` does not exist. Skipping column addition.');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove column from `foodprint_weeklyview` if it exists
    const tables = await queryInterface.showAllTables();
    const weeklyviewTableExists = tables.includes('foodprint_weeklyview');

    if (weeklyviewTableExists) {
      await queryInterface.removeColumn('foodprint_weeklyview', 'harvest_image_url');
    } else {
      console.warn('Table `foodprint_weeklyview` does not exist. Skipping column removal.');
    }
  },
};