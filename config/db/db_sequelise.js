const env = process.env.NODE_ENV || 'development';
const config = require('./dbconfig')[env];
const { Sequelize } = require('sequelize');

// Hardcoded dialect for debugging
const DIALECT = 'postgres'; // Change to your DB type if needed (e.g., 'mysql', 'sqlite', 'mssql')

let sequelize;

// Ensure dialect is always defined
if (!config.dialect) {
  console.warn(`Dialect is missing in config. Defaulting to '${DIALECT}'`);
  config.dialect = DIALECT;
}

if (process.env.DB_URL) {
  sequelize = new Sequelize(process.env.DB_URL, {
    dialect: config.dialect, 
    logging: false, // Set to true for debugging SQL queries
    dialectOptions: config.dialectOptions || {}, // Ensure SSL and other options are applied
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host || 'localhost',
    dialect: config.dialect, 
    logging: false,
    dialectOptions: config.dialectOptions || {},
  });
}

// 🔍 **Test connection (Optional, for debugging)**
sequelize
  .authenticate()
  .then(() => console.log('✅ Database connected successfully!'))
  .catch((err) => console.error('❌ Database connection failed:', err));

module.exports = sequelize;
