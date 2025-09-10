// routes/apiRoutes.js
import express from 'express';
import LGA from '../models/LGA.js';
// We won't fetch schools from DB yet, just dummy ones
// import School from '../models/School.js';

const router = express.Router();

// Get LGAs by state
router.get('/lgas/:stateId', async (req, res) => {
  try {
    const lgas = await LGA.findAll({
      where: { stateId: req.params.stateId },
      attributes: ['id', 'name'], // only send necessary fields
      order: [['name', 'ASC']],
    });
    res.json(lgas);
  } catch (err) {
    console.error('❌ Error fetching LGAs:', err);
    res.status(500).json({ error: 'Error fetching LGAs' });
  }
});

// Dummy schools for testing
router.get('/schools/:lgaId', async (req, res) => {
  const schools = [
    { id: 1, name: 'Government Secondary School A' },
    { id: 2, name: 'Government Secondary School B' },
    { id: 3, name: 'Community High School C' },
  ];
  res.json(schools);
});

export default router;
