const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_activated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activation_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_password_otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_password_otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reset_password_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferences: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({
      fontSize: 'medium',
      noteColor: 'default',
      theme: 'light'
    }),
    get() {
      const raw = this.getDataValue('preferences');
      try {
        return raw ? JSON.parse(raw) : { fontSize: 'medium', noteColor: 'default', theme: 'light' };
      } catch (e) {
        return { fontSize: 'medium', noteColor: 'default', theme: 'light' };
      }
    },
    set(val) {
      this.setDataValue('preferences', typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;
