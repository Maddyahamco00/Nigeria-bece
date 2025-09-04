// models/Student.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Student = sequelize.define(
  "Student",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true },
    regNumber: { type: DataTypes.STRING, unique: true }, // e.g. BECE2505136711
    gender: { type: DataTypes.ENUM("Male", "Female"), allowNull: true },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    guardianPhone: { type: DataTypes.STRING, allowNull: true },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "schools", key: "id" },
    },
  },
  {
    tableName: "students",
    timestamps: false,
  }
);

export default Student;
