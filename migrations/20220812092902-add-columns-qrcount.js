'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the table exists
    const tables = await queryInterface.showAllTables();
    const qrcountTableExists = tables.includes('foodprint_qrcount');

    // Add columns to `foodprint_qrcount` if it exists
    if (qrcountTableExists) {
      const qrcountColumns = await queryInterface.describeTable('foodprint_qrcount');

      if (!qrcountColumns.qrtype) {
        await queryInterface.addColumn('foodprint_qrcount', 'qrtype', {
          type: Sequelize.STRING,
        });
      }

      if (!qrcountColumns.qrlogid) {
        await queryInterface.addColumn('foodprint_qrcount', 'qrlogid', {
          type: Sequelize.STRING,
        });
      }

      if (!qrcountColumns.user_email) {
        await queryInterface.addColumn('foodprint_qrcount', 'user_email', {
          type: Sequelize.STRING,
        });
      }

      if (!qrcountColumns.location) {
        await queryInterface.addColumn('foodprint_qrcount', 'location', {
          type: Sequelize.STRING,
        });
      }
    } else {
      console.warn('Table `foodprint_qrcount` does not exist. Skipping column additions.');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from `foodprint_qrcount` if it exists
    const tables = await queryInterface.showAllTables();
    const qrcountTableExists = tables.includes('foodprint_qrcount');

    if (qrcountTableExists) {
      await queryInterface.removeColumn('foodprint_qrcount', 'qrtype');
      await queryInterface.removeColumn('foodprint_qrcount', 'qrlogid');
      await queryInterface.removeColumn('foodprint_qrcount', 'user_email');
      await queryInterface.removeColumn('foodprint_qrcount', 'location');
    } else {
      console.warn('Table `foodprint_qrcount` does not exist. Skipping column removals.');
    }
  },
};