// models/LGA.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import State from "./State.js";

const LGA = sequelize.define("LGA", {
  name: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: "lgas",
  timestamps: false,
});

// Relation: each LGA belongs to a State
LGA.belongsTo(State, { foreignKey: "stateId" });
State.hasMany(LGA, { foreignKey: "stateId" });

export default LGA;
