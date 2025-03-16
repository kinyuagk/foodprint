'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if indexes exist
    const configIndexes = await queryInterface.showIndex('foodprint_config');
    const harvestIndexes = await queryInterface.showIndex('foodprint_harvest');

    // Only remove existing indexes
    if (configIndexes.some(index => index.name === 'config_key')) {
      await queryInterface.removeIndex('foodprint_config', 'config_key');
    }

    if (harvestIndexes.some(index => index.name === 'product_name')) {
      await queryInterface.removeIndex('foodprint_harvest', 'product_name');
    }
  },

  async down(queryInterface, Sequelize) {
    // Recreate indexes safely
    await queryInterface.addIndex('foodprint_config', ['config_key'], {
      name: 'config_key',
      unique: true,
      fields: ['config_key']
    });

    await queryInterface.addIndex('foodprint_harvest', ['product_name'], {
      name: 'product_name',
      fields: ['product_name']
    });
  }
};