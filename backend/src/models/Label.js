const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Label = sequelize.define('Label', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'labels',
  timestamps: true,
  underscored: true
});

module.exports = Label;
