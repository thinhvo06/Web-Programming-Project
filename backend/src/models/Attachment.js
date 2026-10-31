const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  note_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_type: {
    type: DataTypes.ENUM('image', 'video', 'file'),
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'attachments',
  timestamps: true,
  underscored: true
});

module.exports = Attachment;
