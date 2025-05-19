//This model stores student information, including their state and school affiliations.

// models/Student.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define(
    'Student',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      registrationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
      },
      stateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'states',
          key: 'id',
        },
      },
    },
    {
      tableName: 'students',
      timestamps: true,
    }
  );

  Student.associate = (models) => {
    Student.belongsTo(models.User, { foreignKey: 'userId' });
    Student.belongsTo(models.School, { foreignKey: 'schoolId' });
    Student.belongsTo(models.State, { foreignKey: 'stateId' });
    Student.hasMany(models.Payment, { foreignKey: 'studentId' });
  };

  return Student;
};