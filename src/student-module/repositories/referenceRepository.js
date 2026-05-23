// Reference repository (state/lga/school lookups)

import { LGA, School, State } from '../../../models/index.js';

export class ReferenceRepository {
  async getStates() {
    return State.findAll({ order: [['name', 'ASC']] });
  }

  async getLgasByStateId(stateId) {
    return LGA.findAll({
      where: { stateId },
      attributes: ['id', 'name'],
    });
  }

  async getStateById(stateId) {
    return State.findByPk(stateId);
  }

  async getLgaById(lgaId) {
    return LGA.findByPk(lgaId);
  }

  async getSchoolById(schoolId) {
    return School.findByPk(schoolId);
  }
}

