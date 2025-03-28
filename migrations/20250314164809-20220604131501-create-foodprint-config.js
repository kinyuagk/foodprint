'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('foodprint_config', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      config_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Ensures no duplicate keys
      },
      config_value: {
        type: Sequelize.TEXT, // Use TEXT for longer values
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('foodprint_config');
  },
};