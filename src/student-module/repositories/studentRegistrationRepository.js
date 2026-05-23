// Student registration repository
// Encapsulates cross-table checks needed for registration.

import { Student } from '../../../models/index.js';
import db from '../../../config/database.js';

export class StudentRegistrationRepository {
  async findByEmail(email) {
    return Student.findOne({ where: { email } });
  }

  async linkPreRegistrationPayment({ payment_reference }) {
    // Preserve legacy behavior: do not throw hard if payment linkage fails.
    await db.query(
      `UPDATE pre_reg_payments SET payment_status = 'Registered' WHERE payment_reference = ?`,
      { replacements: [payment_reference] }
    );
  }
}

