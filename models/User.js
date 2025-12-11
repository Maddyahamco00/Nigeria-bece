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
      type: DataTypes.ENUM('super_admin', 'admin', 'state_admin', 'school_admin', 'exam_admin', 'feedback_admin'),
      defaultValue: 'admin',
    },
    stateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'States',
        key: 'id'
      }
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Schools',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {},
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