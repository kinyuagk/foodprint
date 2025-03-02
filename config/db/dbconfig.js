require('dotenv').config();

const defaultConfig = {
  url: process.env.DB_URL || 'mysql://foodprint_user:securepassword@localhost:3306/foodprint',
  dialect: process.env.DB_DIALECT || 'mysql', // Ensure dialect is explicitly set
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

module.exports = {
  development: { ...defaultConfig, logging: true },
  test: { ...defaultConfig, logging: false },
  staging: { ...defaultConfig, logging: true },
  production: { ...defaultConfig, logging: false },
};

