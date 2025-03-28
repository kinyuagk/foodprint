require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const env = process.env.NODE_ENV || 'development';
const config = require('./dbconfig')[env];

// Remove ALL auth plugin references - use only basic config
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host || '127.0.0.1',
    port: config.port || 3306,
    dialect: 'mysql',
    dialectModule: mysql2, // This is the only crucial line for auth
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  }
);

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    // Start Swagger after DB connection
    require('../swagger'); // Adjust path as needed
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n🔧 Run these MariaDB commands:');
    console.log(`1. DROP USER IF EXISTS '${config.username}'@'localhost';`);
    console.log(`2. CREATE USER '${config.username}'@'localhost' IDENTIFIED BY '${config.password}';`);
    console.log(`3. GRANT ALL ON ${config.database}.* TO '${config.username}'@'localhost';`);
    console.log('4. FLUSH PRIVILEGES;');
    process.exit(1);
  });

module.exports = sequelize;
