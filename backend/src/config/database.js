const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'tdtu_note_app',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? false : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  const storagePath = process.env.DB_STORAGE 
    ? path.resolve(__dirname, '../../', process.env.DB_STORAGE)
    : path.resolve(__dirname, '../../database.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
}

module.exports = sequelize;
