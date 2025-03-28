require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const env = process.env.NODE_ENV || 'development';
const config = require('./dbconfig')[env];

// Enhanced MariaDB configuration
const sequelizeConfig = {
  dialect: 'mysql',
  dialectModule: mysql2,
  host: config.host || '127.0.0.1', // Use 127.0.0.1 instead of localhost
  port: config.port || 3306,
  username: config.username || 'foodprint_user', // Use the user you created
  password: config.password || 'strong_password_123',
  database: config.database || 'foodprint',
  dialectOptions: {
    authPlugins: {
      mysql_native_password: mysql2.authPlugins.mysql_native_password()
    },
    connectTimeout: 60000,
    supportBigNumbers: true,
    bigNumberStrings: false
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
  logging: process.env.NODE_ENV === 'development' ? console.log : false
};

const sequelize = new Sequelize(sequelizeConfig);

// Test connection with enhanced error handling
sequelize.authenticate()
  .then(() => {
    console.log('✅ MariaDB connection established');
    console.log(`   Database: ${sequelizeConfig.database}`);
    console.log(`   User: ${sequelizeConfig.username}@${sequelizeConfig.host}`);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Verify MariaDB is running:');
    console.log('   mariadbd-safe -u root &');
    console.log('2. Check user privileges:');
    console.log(`   GRANT ALL ON ${sequelizeConfig.database}.* TO '${sequelizeConfig.username}'@'localhost';`);
    console.log('3. Test connection manually:');
    console.log(`   mariadb -u ${sequelizeConfig.username} -p -h ${sequelizeConfig.host}`);
    
    if (err.original) {
      console.error('\nOriginal error:', err.original.message);
    }
    process.exit(1);
  });

module.exports = sequelize;
