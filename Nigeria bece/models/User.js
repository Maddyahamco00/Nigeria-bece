//This model represents admin users who manage the system (e.g., school admins or super admins).

// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');

// This model represents admin users who manage the system (e.g., school admins or super admins).
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiration: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users', //  Ensures Sequelize uses the correct lowercase table name
  timestamps: true,   //  Adds createdAt and updatedAt fields automatically
  hooks: {
    beforeCreate: async (user) => {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  }
});

module.exports = User;
