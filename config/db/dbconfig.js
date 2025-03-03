require('dotenv').config();

const defaultConfig = {
  username: process.env.DB_USER || 'foodprint_user',
  password: process.env.DB_PASSWORD || 'securepassword',
  database: process.env.DB_NAME || 'foodprint',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql', // Ensure this is a string, NOT an object!
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: process.env.DB_SSL === 'true' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    }
  } : {},
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
    acquire: parseInt(process.env.DB_ACQUIRE, 10) || 30000,
    idle: parseInt(process.env.DB_IDLE, 10) || 10000,
  },
};

module.exports = {
  development: { ...defaultConfig },
  test: { ...defaultConfig },
  staging: { ...defaultConfig },
  production: { ...defaultConfig },
};
