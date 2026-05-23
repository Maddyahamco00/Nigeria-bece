declare namespace _default {
    export { User };
    export { Student };
    export { School };
    export { State };
    export { LGA };
    export { Subject };
    export { Payment };
    export { Result };
    export { ExamTimetable };
    export { ExamCenter };
    export { Certificate };
    export { sequelize };
}
export default _default;
import sequelize from '../config/database.js';
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
export { sequelize, User, Student, School, State, LGA, Subject, Payment, Result, ExamTimetable, ExamCenter, Certificate };
//# sourceMappingURL=index.d.ts.map