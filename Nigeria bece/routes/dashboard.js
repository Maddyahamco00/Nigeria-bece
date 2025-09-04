// routes/dashboard.js
import express from 'express';
import { Student, School, Payment } from '../models/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalSchools = await School.count();
    const totalPayments = await Payment.count();

    res.render('admin/dashboard', {
      stats: {
        students: totalStudents,
        schools: totalSchools,
        payments: totalPayments
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Dashboard error");
  }
});

export default router;
