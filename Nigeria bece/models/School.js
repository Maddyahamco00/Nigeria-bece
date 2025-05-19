//This model represents schools registered in the system.

// models/School.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const School = sequelize.define(
    'School',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
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
      tableName: 'schools',
      timestamps: true,
    }
  );

  School.associate = (models) => {
    School.belongsTo(models.User, { foreignKey: 'userId' });
    School.belongsTo(models.State, { foreignKey: 'stateId' });
    School.hasMany(models.Student, { foreignKey: 'schoolId' });
  };

  return School;
};