// models/School.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import LGA from "./LGA.js";

const School = sequelize.define("School", {
  name: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: "schools",
  timestamps: false,
});

// Relation: each School belongs to an LGA
School.belongsTo(LGA, { foreignKey: "lgaId" });
LGA.hasMany(School, { foreignKey: "lgaId" });

export default School;
