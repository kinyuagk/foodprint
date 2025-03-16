'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the table exists
    const tables = await queryInterface.showAllTables();
    const userTableExists = tables.includes('user');

    // Add column to `user` if it exists
    if (userTableExists) {
      const userColumns = await queryInterface.describeTable('user');

      if (!userColumns.user_identifier_image_url) {
        await queryInterface.addColumn('user', 'user_identifier_image_url', {
          type: Sequelize.STRING,
        });
      }
    } else {
      console.warn('Table `user` does not exist. Skipping column addition.');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove column from `user` if it exists
    const tables = await queryInterface.showAllTables();
    const userTableExists = tables.includes('user');

    if (userTableExists) {
      await queryInterface.removeColumn('user', 'user_identifier_image_url');
    } else {
      console.warn('Table `user` does not exist. Skipping column removal.');
    }
  },
};