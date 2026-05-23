// Student queries repository
// Read-heavy endpoints used by services (dashboard/results/payments).

import { LGA, Payment, Result, School, State, Student, Subject } from '../../../models/index.js';

export class StudentQueriesRepository {
  async getSubjects() {
    return Subject.findAll({ order: [['name', 'ASC']] });
  }

  async getStudentForRegistrationSteps(studentId) {
    return Student.findByPk(studentId, { include: [School, State, LGA] });
  }

  async getStudentDashboard(studentId) {
    // Mirror legacy includes
    return Student.findByPk(studentId, {
      include: [
        { model: School, attributes: ['name', 'address'] },
        { model: State, attributes: ['name'] },
        { model: LGA, attributes: ['name'] },
      ]
    });
  }

  async getStudentResults(studentId) {
    return Result.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']],
    });
  }

  async getStudentProfile(studentId) {
    return Student.findByPk(studentId, {
      include: [School, State, LGA],
      attributes: { exclude: ['password'] }
    });
  }

  async getStudentLoginByRegNumber(regNumber) {
    return Student.findOne({ where: { regNumber } });
  }

  async getStudentPayments(studentId) {
    return Payment.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']],
    });
  }
}

