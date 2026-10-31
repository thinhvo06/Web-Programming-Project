const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NoteLabel = sequelize.define('NoteLabel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  note_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  label_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'note_labels',
  timestamps: false,
  underscored: true
});

module.exports = NoteLabel;
