//This file sets up the Sequelize connection to the MySQL database and initializes model associations.

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with MySQL connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Disable logging for production
  }
);

// Define models
const models = {
  User: require('./User')(sequelize),
  Student: require('./Student')(sequelize),
  School: require('./School')(sequelize),
  Payment: require('./Payment')(sequelize),
  State: require('./State')(sequelize),
};

// Define associations
Object.keys(models).forEach((modelName) => {
  if ('associate' in models[modelName]) {
    models[modelName].associate(models);
  }
});

// Export sequelize instance and models
module.exports = {
  sequelize,
  Sequelize,
  models,
};
// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  })