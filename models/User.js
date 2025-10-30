// models/User.js
import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';


const User = sequelize.define(
  'User',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Name is required' } },
    },
    email: {
      type: DataTypes.STRING,
      unique: { msg: 'Email already exists' },
      allowNull: false,
      validate: { isEmail: { msg: 'Must be a valid email' } },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('superadmin', 'admin', 'user'),
      defaultValue: 'user',
    },
    resetToken: { type: DataTypes.STRING, allowNull: true },
    resetTokenExpiration: { type: DataTypes.DATE, allowNull: true },
    // Removed isActive field since it doesn't exist in database
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed && user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method to check password
User.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default User;