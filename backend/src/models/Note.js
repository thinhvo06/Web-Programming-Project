const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pinned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: 'default'
  }
}, {
  tableName: 'notes',
  timestamps: true,
  underscored: true
});

module.exports = Note;
