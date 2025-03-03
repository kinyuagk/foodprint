require('dotenv').config();
const { Sequelize } = require("sequelize");

// Debugging: Check if .env loaded correctly
if (!process.env.DB_URL) {
  console.error("⚠️ WARNING: DB_URL not found! Using default MySQL config.");
}

// Debugging: Log database connection info
console.log("🚀 Connecting to:", process.env.DB_URL || 'mysql://foodprint_user:securepassword@localhost:3306/foodprint');

const defaultConfig = {
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: process.env.DB_LOGGING === 'true',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
    acquire: parseInt(process.env.DB_ACQUIRE, 10) || 30000,
    idle: parseInt(process.env.DB_IDLE, 10) || 10000,
  },
};

// Ensures Sequelize URL parsing is handled correctly
const sequelizeConfig = process.env.DB_URL 
  ? new Sequelize(process.env.DB_URL, defaultConfig)
  : new Sequelize('foodprint', 'foodprint_user', 'securepassword', {
      host: process.env.DB_HOST || 'localhost',
      ...defaultConfig,
    });

module.exports = sequelizeConfig;
