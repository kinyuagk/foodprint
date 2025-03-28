require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const env = process.env.NODE_ENV || 'development';
const config = require('./dbconfig')[env];

// Validate essential configuration
if (!config) {
  throw new Error(`Database configuration not found for environment: ${env}`);
}

// Enhanced MySQL configuration
const mysqlConfig = {
  dialect: 'mysql',
  dialectModule: mysql2,
  dialectOptions: {
    authPlugins: {
      caching_sha2_password: mysql2.authPlugins.caching_sha2_password(),
      mysql_clear_password: () => () => Buffer.from([0]),
      sha256_password: () => () => Buffer.from([0])
    },
    ssl: process.env.DB_SSL === 'true' ? { 
      rejectUnauthorized: process.env.DB_SSL_STRICT !== 'false'
    } : false,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'),
    timezone: process.env.DB_TIMEZONE || '+00:00',
    decimalNumbers: true, // Return decimals as numbers instead of strings
    supportBigNumbers: true // Handle BIGINTs correctly
  },
  logging: process.env.SEQUELIZE_LOGGING === 'true' 
    ? (msg) => console.log(`[Sequelize] ${msg}`) 
    : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000')
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: process.env.DB_PARANOID === 'true', // Soft deletes
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  },
  retry: {
    max: parseInt(process.env.DB_RETRY_MAX || '3'),
    match: [
      /ETIMEDOUT/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ER_ACCESS_DENIED_ERROR/,
      /ER_LOCK_WAIT_TIMEOUT/,
      Sequelize.ConnectionError
    ]
  },
  benchmark: process.env.SEQUELIZE_BENCHMARK === 'true'
};

let sequelize;

// Connection initialization with enhanced error handling
try {
  if (process.env.DB_URL) {
    sequelize = new Sequelize(process.env.DB_URL, {
      ...mysqlConfig,
      dialectOptions: {
        ...mysqlConfig.dialectOptions,
        ...(process.env.DB_SSL === 'true' && {
          ssl: {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_STRICT !== 'false'
          }
        })
      }
    });
  } else {
    if (!config.database || !config.username) {
      throw new Error('Database name and username are required in configuration');
    }

    sequelize = new Sequelize(
      config.database,
      config.username,
      config.password || null, // Allow empty password
      {
        host: config.host || 'localhost',
        port: config.port || 3306,
        ...mysqlConfig
      }
    );
  }

  // Add connection events
  sequelize.addHook('afterConnect', (connection) => {
    console.log('New database connection established');
  });

  sequelize.addHook('afterDisconnect', (connection) => {
    console.warn('Database connection disconnected');
  });

} catch (configError) {
  console.error('❌ Database configuration error:', configError.message);
  process.exit(1);
}

// Enhanced connection test
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    
    const [results] = await sequelize.query("SELECT VERSION() AS version");
    console.log('✅ Database connection established successfully');
    console.log(`   Database: ${config.database}`);
    console.log(`   MySQL Version: ${results[0].version}`);
    console.log(`   Authentication: ${sequelize.connectionManager.dialect.authPlugin}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Detailed troubleshooting guide
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Verify credentials:');
    console.log(`   - Host: ${config.host || 'localhost'}:${config.port || 3306}`);
    console.log(`   - User: ${config.username}`);
    console.log(`   - Database: ${config.database}`);
    
    console.log('\n2. Test manual connection:');
    console.log(`   mysql -u ${config.username} -p -h ${config.host || 'localhost'} -P ${config.port || 3306} ${config.database}`);
    
    console.log('\n3. Check user privileges:');
    console.log(`   GRANT ALL PRIVILEGES ON ${config.database}.* TO '${config.username}'@'${config.host || 'localhost'}' IDENTIFIED BY 'your_password';`);
    
    console.log('\n4. Common solutions:');
    console.log('   - For caching_sha2_password errors, try:');
    console.log(`     ALTER USER '${config.username}'@'${config.host || 'localhost'}' IDENTIFIED WITH mysql_native_password BY 'your_password';`);
    console.log('   - For connection issues, verify:');
    console.log('     * MySQL server is running');
    console.log('     * Firewall allows connections');
    console.log('     * Remote connections are enabled if connecting to remote host');
    
    if (error.original) {
      console.error('\nOriginal error:', error.original.message);
      if (error.original.code) {
        console.log('Error code:', error.original.code);
      }
    }
    
    return false;
  }
};

// Export both sequelize instance and connection tester
module.exports = {
  sequelize,
  testConnection,
  mysqlConfig
};
