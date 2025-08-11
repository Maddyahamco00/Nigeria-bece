//This model stores Nigeria's 36 states + FCT, used for geographic categorization.
// This model is used to categorize schools and students by their respective states.
// model/State.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const State = sequelize.define(
    'State',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'states',
      timestamps: false, // No timestamps for static data
    }
  );

  State.associate = (models) => {
    State.hasMany(models.School, { foreignKey: 'stateId' });
    State.hasMany(models.Student, { foreignKey: 'stateId' });
  };

  return State;
};