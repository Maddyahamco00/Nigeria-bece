// models/index.js
import sequelize from '../config/database.js';

// Import model definitions
import User from './User.js';
import Student from './Student.js';
import School from './School.js';
import State from './State.js';
import LGA from './LGA.js';
import Subject from './Subject.js';
import Payment from './Payment.js';
import Result from './Result.js';
import ExamTimetable from './ExamTimetable.js';
import ExamCenter from './ExamCenter.js';
import Certificate from './Certificate.js';

// Ensure models are initialized (the model files should call sequelize.define and export default)
const models = {
  User,
  Student,
  School,
  State,
  LGA,
  Subject,
  Payment,
  Result,
  ExamTimetable,
  ExamCenter,
  Certificate,
};

// ----- Associations -----

// State <-> LGA
State.hasMany(LGA, { foreignKey: 'stateId', onDelete: 'CASCADE' });
LGA.belongsTo(State, { foreignKey: 'stateId' });

// LGA <-> School
LGA.hasMany(School, { foreignKey: 'lgaId', onDelete: 'CASCADE' });
School.belongsTo(LGA, { foreignKey: 'lgaId' });

// School <-> Student
School.hasMany(Student, { foreignKey: 'schoolId', onDelete: 'CASCADE' });
Student.belongsTo(School, { foreignKey: 'schoolId' });

// Student <-> State
State.hasMany(Student, { foreignKey: 'stateId', onDelete: 'CASCADE' });
Student.belongsTo(State, { foreignKey: 'stateId' });

// Student <-> LGA
LGA.hasMany(Student, { foreignKey: 'lgaId', onDelete: 'CASCADE' });
Student.belongsTo(LGA, { foreignKey: 'lgaId' });

// School <-> Payment
School.hasMany(Payment, { foreignKey: 'schoolId', onDelete: 'CASCADE' });
Payment.belongsTo(School, { foreignKey: 'schoolId' });

// Student <-> Result
Student.hasMany(Result, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Result.belongsTo(Student, { foreignKey: 'studentId' });

// State <-> School
State.hasMany(School, { foreignKey: 'stateId', onDelete: 'CASCADE' });
School.belongsTo(State, { foreignKey: 'stateId' });

// ✅ NEW: Result <-> School
School.hasMany(Result, { foreignKey: 'schoolId', onDelete: 'CASCADE' });
Result.belongsTo(School, { foreignKey: 'schoolId' });

// ✅ NEW: Payment <-> Student
Student.hasMany(Payment, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Payment.belongsTo(Student, { foreignKey: 'studentId' });

// Subject <-> Result (Many-to-Many through ResultSubjects)
Subject.belongsToMany(Result, { through: 'ResultSubjects', foreignKey: 'subjectId' });
Result.belongsToMany(Subject, { through: 'ResultSubjects', foreignKey: 'resultId' });

// New model associations
State.hasMany(ExamCenter, { foreignKey: 'stateId', onDelete: 'CASCADE' });
ExamCenter.belongsTo(State, { foreignKey: 'stateId' });

LGA.hasMany(ExamCenter, { foreignKey: 'lgaId', onDelete: 'CASCADE' });
ExamCenter.belongsTo(LGA, { foreignKey: 'lgaId' });

Student.hasMany(Certificate, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Certificate.belongsTo(Student, { foreignKey: 'studentId' });

// Export everything for convenient imports
export {
  sequelize,
  User,
  Student,
  School,
  State,
  LGA,
  Subject,
  Payment,
  Result,
  ExamTimetable,
  ExamCenter,
  Certificate,
};

export default {
  sequelize,
  ...models,
};
