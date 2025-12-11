// routes/apiRoutes.js
import express from 'express';
import { LGA, School } from '../models/index.js';

const router = express.Router();

// Get all LGAs for a given state
router.get('/lgas/:stateId', async (req, res) => {
  try {
    const { stateId } = req.params;
    const lgas = await LGA.findAll({ where: { stateId } });
    res.json(lgas);
  } catch (err) {
    console.error('❌ Error fetching LGAs:', err);
    res.status(500).json({ error: 'Failed to load LGAs' });
  }
});

// Get all schools for a given LGA
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
