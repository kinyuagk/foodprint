'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the table exists
    const tables = await queryInterface.showAllTables();
    const userTableExists = tables.includes('user');

    // Modify the `email` column in `user` if it exists
    if (userTableExists) {
      const userColumns = await queryInterface.describeTable('user');

      if (userColumns.email) {
        await queryInterface.changeColumn('user', 'email', {
          type: Sequelize.STRING,
          allowNull: true, // Allow null values
        });
      }
    } else {
      console.warn('Table `user` does not exist. Skipping column modification.');
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert the `email` column change if the table exists
    const tables = await queryInterface.showAllTables();
    const userTableExists = tables.includes('user');

    if (userTableExists) {
      await queryInterface.changeColumn('user', 'email', {
        type: Sequelize.STRING,
        allowNull: false, // Revert to not allowing null values
      });
    } else {
      console.warn('Table `user` does not exist. Skipping column modification.');
    }
  },
};
