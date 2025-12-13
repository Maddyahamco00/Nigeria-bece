// routes/apiRoutes.js
import express from 'express';
import { State, LGA, School } from '../models/index.js';

const router = express.Router();

// Get all states
router.get('/states', async (req, res) => {
  try {
    const states = await State.findAll({
      order: [['name', 'ASC']]
    });
    res.json(states);
  } catch (err) {
    console.error('❌ Error fetching states:', err);
    res.status(500).json({ error: 'Failed to load states' });
  }
});

// Get all LGAs for a given state
router.get('/lgas/:stateId', async (req, res) => {
  try {
    const { stateId } = req.params;
    console.log('🏢 Fetching LGAs for state:', stateId);
    const lgas = await LGA.findAll({ 
      where: { stateId },
      attributes: ['id', 'name']
    });
    console.log('🏢 Found LGAs:', lgas.length);
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
    console.log('🏫 Fetching schools for LGA:', lgaId);
    const schools = await School.findAll({ 
      where: { lgaId },
      attributes: ['id', 'name', 'address']
    });
    console.log('🏫 Found schools:', schools.length);
    res.json(schools);
  } catch (err) {
    console.error('❌ Error fetching schools:', err);
    res.status(500).json({ error: 'Failed to load schools' });
  }
});

export default router;
