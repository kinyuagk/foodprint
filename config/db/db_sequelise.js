require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const env = process.env.NODE_ENV || 'development';
const config = require('./dbconfig')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host || '127.0.0.1',
    port: config.port || 3306,
    dialect: 'mysql',
    dialectModule: mysql2,
    dialectOptions: {
      // ONLY use mysql_native_password - remove all other auth plugins
      authPlugins: {
        mysql_native_password: mysql2.authPlugins.mysql_native_password()
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    logging: console.log
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connection established'))
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n🔧 Run these commands in MariaDB:');
    console.log(`1. CREATE USER '${config.username}'@'localhost' IDENTIFIED BY '${config.password}';`);
    console.log(`2. GRANT ALL PRIVILEGES ON ${config.database}.* TO '${config.username}'@'localhost';`);
    console.log('3. FLUSH PRIVILEGES;');
    process.exit(1);
  });

module.exports = sequelize;
