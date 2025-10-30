// routes/schoolRoutes.js

import express from 'express';
import { School } from '../models/index.js';

const router = express.Router();

// Add new school
router.post('/schools', async (req, res) => {
  try {
    const { name, lgaId, address } = req.body;

    if (!name || !lgaId) {
      return res.status(400).json({ error: 'Name and LGA are required' });
    }

    const school = await School.create({ name, lgaId, address });
    res.status(201).json(school);
  } catch (err) {
    console.error('❌ Error creating school:', err);
    res.status(500).json({ error: 'Failed to create school' });
  }
});

// Get all schools by LGA
router.get('/schools/:lgaId', async (req, res) => {
  try {
    const { lgaId } = req.params;
    const schools = await School.findAll({ where: { lgaId } });
    res.json(schools);
  } catch (err) {
    console.error('❌ Error fetching schools:', err);
    res.status(500).json({ error: 'Failed to load schools' });
  }
});

export default router;
