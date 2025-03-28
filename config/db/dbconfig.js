require('dotenv').config();

const commonConfig = {
  username: process.env.DB_USER || 'foodprint_user',
  password: process.env.DB_PASSWORD || 'Kinyingi01@',
  database: process.env.DB_NAME || 'foodprint_db',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432, // PostgreSQL default port
  dialect: 'postgres',
  dialectModule: require('pg'), // Use pg module for PostgreSQL
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
};

module.exports = {
  development: {
    ...commonConfig,
    logging: console.log,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
  },
  test: {
    ...commonConfig,
    logging: false
  },
  production: {
    ...commonConfig,
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 30000
    }
  }
};