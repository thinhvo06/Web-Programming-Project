const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NoteShare = sequelize.define('NoteShare', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  note_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shared_with_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permission: {
    type: DataTypes.ENUM('read', 'edit'),
    defaultValue: 'read',
    allowNull: false
  }
}, {
  tableName: 'note_shares',
  timestamps: true,
  underscored: true
});

module.exports = NoteShare;
