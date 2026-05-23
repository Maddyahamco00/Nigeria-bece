// Student repository (data access layer)

import { Op } from 'sequelize';
import { Student } from '../../../models/index.js';

export class StudentRepository {
  async findById(id) {
    return Student.findByPk(id);
  }

  async findByEmail(email) {
    return Student.findOne({ where: { email } });
  }

  async findByRegNumber(regNumber) {
    return Student.findOne({ where: { regNumber } });
  }

  async create(studentData) {
    return Student.create(studentData);
  }

  async updateById(id, updateData, { transaction } = {}) {
    const student = await Student.findByPk(id, { transaction });
    if (!student) return null;
    await student.update(updateData, { transaction });
    return student;
  }

  async setPassword(id, hashedPassword) {
    const student = await Student.findByPk(id);
    if (!student) return null;
    student.password = hashedPassword;
    await student.save();
    return student;
  }

  async existsEmail(email) {
    const student = await Student.findOne({ where: { email } });
    return !!student;
  }

  async existsRegNumber(regNumber) {
    const student = await Student.findOne({ where: { regNumber } });
    return !!student;
  }

  // Generic search for future listing endpoints (scaffolding)
  async search({ keyword, stateId, lgaId, schoolId, page = 1, limit = 20, orderBy = 'createdAt', orderDir = 'DESC' }) {
    const where = {};

    if (stateId) where.stateId = stateId;
    if (lgaId) where.lgaId = lgaId;
    if (schoolId) where.schoolId = schoolId;

    if (keyword) {
      // Preserve DB compatibility: regNumber + name/email searches
      where[Op.or] = [
        { name: { [Op.iLike || Op.like]: `%${keyword}%` } },
        { email: { [Op.iLike || Op.like]: `%${keyword}%` } },
        { regNumber: { [Op.iLike || Op.like]: `%${keyword}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await Student.findAndCountAll({
      where,
      offset,
      limit,
      order: [[orderBy, orderDir]],
    });

    return {
      items: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      }
    };
  }
}

