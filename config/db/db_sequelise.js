require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const env = process.env.NODE_ENV || 'development';
const config = require('./dbconfig')[env];

// MySQL 8.4+ optimized configuration
const mysqlConfig = {
  dialect: 'mysql',
  dialectModule: mysql2, // Required for MySQL 8+
  dialectOptions: {
    authPlugins: {
      // Modern mysql2 v3+ authentication
      caching_sha2_password: mysql2.authPlugins.caching_sha2_password(),
      // Fallback authentication methods
      mysql_clear_password: () => () => Buffer.from([0]),
      sha256_password: () => () => Buffer.from([0])
    },
    // SSL configuration (enable in production)
    ssl: process.env.DB_SSL === 'true' ? { 
      rejectUnauthorized: false 
    } : false,
    // Additional options
    connectTimeout: 60000,
    timezone: '+00:00' // UTC
  },
  // Logging configuration
  logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
  // Connection pool settings
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Model defaults
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

let sequelize;

if (process.env.DB_URL) {
  // For connection URLs
  sequelize = new Sequelize(process.env.DB_URL, {
    ...mysqlConfig,
    // URL takes priority over other configs
    dialectOptions: {
      ...mysqlConfig.dialectOptions,
      ...(process.env.DB_SSL === 'true' && {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      })
    }
  });
} else {
  // For individual connection parameters
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host || 'localhost',
      port: config.port || 3306,
      ...mysqlConfig
    }
  );
}

// Enhanced connection test with diagnostics
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connection established');
    console.log(`   Database: ${config.database}`);
    console.log(`   Authentication: ${sequelize.connectionManager.dialect.authPlugin}`);
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.log('\n🔧 Troubleshooting Guide:');
    console.log('1. Verify credentials in .env match MySQL:');
    console.log(`   - User: ${config.username}@${config.host}`);
    console.log(`   - Database: ${config.database}`);
    console.log('2. Check MySQL user privileges:');
    console.log(`   GRANT ALL ON ${config.database}.* TO '${config.username}'@'${config.host || 'localhost'}';`);
    console.log('3. Test manual connection:');
    console.log(`   mysql -u ${config.username} -p -h ${config.host || 'localhost'} ${config.database}`);
    console.log('4. Check MySQL error logs for details');
    
    if (err.original) {
      console.error('\nOriginal error:', err.original.message);
    }
  });

module.exports = sequelize;