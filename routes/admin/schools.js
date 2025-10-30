// routes/admin/schools.js
import express from 'express';
import { School, LGA, State, Student } from '../../models/index.js';
import { requireAdmin } from '../../middleware/roleMiddleware.js';

const router = express.Router();

// List schools
router.get('/', requireAdmin, async (req, res) => {
  try {
    const schools = await School.findAll({
      include: [LGA, State, Student],
      order: [['name', 'ASC']]
    });

    res.render('admin/schools/list', {
      title: 'Manage Schools',
      schools,
      user: req.user
    });
  } catch (err) {
    console.error('Schools error:', err);
    req.flash('error', 'Failed to load schools');
    res.redirect('/admin/dashboard');
  }
});

// Add school form
router.get('/add', requireAdmin, async (req, res) => {
  try {
    const states = await State.findAll();
    const lgas = await LGA.findAll();

    res.render('admin/schools/add', {
      title: 'Add New School',
      states,
      lgas,
      user: req.user
    });
  } catch (err) {
    console.error('Add school form error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/admin/schools');
  }
});

// Create school
router.post('/add', requireAdmin, async (req, res) => {
  try {
    const { name, lgaId, address, stateCode, schoolSerial } = req.body;

    await School.create({
      name,
      lgaId,
      address,
      stateCode,
      schoolSerial
    });

    req.flash('success', 'School added successfully');
    res.redirect('/admin/schools');
  } catch (err) {
    console.error('Create school error:', err);
    req.flash('error', 'Failed to add school');
    res.redirect('/admin/schools/add');
  }
});

export default router;