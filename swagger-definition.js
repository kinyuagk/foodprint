// config/swagger-definition.js
module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'FoodPrint API',
    version: '1.0.0',
    description: 'Food Supply Chain Blockchain API Documentation'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.foodprint.example.com',
      description: 'Production server'
    }
  ]
};