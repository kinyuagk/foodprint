require('dotenv').config();

module.exports = {
  development: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'foodprint_user',
    password: process.env.DB_PASS || 'strong_password_123',
    database: process.env.DB_NAME || 'foodprint',
    dialect: 'mysql'
  },
  test: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'foodprint_test',
    password: process.env.DB_PASS || 'test_password',
    database: process.env.DB_NAME || 'foodprint_test',
    dialect: 'mysql'
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
