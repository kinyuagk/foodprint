'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the table exists
    const tables = await queryInterface.showAllTables();
    const qrcodeTableExists = tables.includes('foodprint_qrcode');
    const productAttributesTableExists = tables.includes('foodprint_qrcode_product_attributes');

    // Add columns to `foodprint_qrcode` if it exists
    if (qrcodeTableExists) {
      const qrcodeColumns = await queryInterface.describeTable('foodprint_qrcode');

      if (!qrcodeColumns.qrcode_supplier_product) {
        await queryInterface.addColumn('foodprint_qrcode', 'qrcode_supplier_product', {
          type: Sequelize.STRING,
        });
      }

      if (!qrcodeColumns.qrcode_hashid) {
        await queryInterface.addColumn('foodprint_qrcode', 'qrcode_hashid', {
          type: Sequelize.STRING,
        });
      }

      if (!qrcodeColumns.qrcode_company_logo_url) {
        await queryInterface.addColumn('foodprint_qrcode', 'qrcode_company_logo_url', {
          type: Sequelize.STRING,
        });
      }
    }

    // Add columns to `foodprint_qrcode_product_attributes` if it exists
    if (productAttributesTableExists) {
      const productAttributesColumns = await queryInterface.describeTable('foodprint_qrcode_product_attributes');

      if (!productAttributesColumns.qrcode_hashid) {
        await queryInterface.addColumn('foodprint_qrcode_product_attributes', 'qrcode_hashid', {
          type: Sequelize.STRING,
          allowNull: false,
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from `foodprint_qrcode` if it exists
    const tables = await queryInterface.showAllTables();
    const qrcodeTableExists = tables.includes('foodprint_qrcode');
    const productAttributesTableExists = tables.includes('foodprint_qrcode_product_attributes');

    if (qrcodeTableExists) {
      await queryInterface.removeColumn('foodprint_qrcode', 'qrcode_supplier_product');
      await queryInterface.removeColumn('foodprint_qrcode', 'qrcode_hashid');
      await queryInterface.removeColumn('foodprint_qrcode', 'qrcode_company_logo_url');
    }

    // Remove columns from `foodprint_qrcode_product_attributes` if it exists
    if (productAttributesTableExists) {
      await queryInterface.removeColumn('foodprint_qrcode_product_attributes', 'qrcode_hashid');
    }
  },
};