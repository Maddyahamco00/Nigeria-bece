// routes/apiRoutes.js
import express from 'express';
import LGA from '../models/LGA.js';
import School from '../models/School.js';

const router = express.Router();

// Get LGAs by state
router.get('/lgas/:stateId', async (req, res) => {
  try {
    const lgas = await LGA.findAll({ where: { stateId: req.params.stateId } });
    res.json(lgas);
  } catch (err) {
    res.status(500).json({ error: "Error fetching LGAs" });
  }
});

// Get Schools by LGA
router.get('/schools/:lgaId', async (req, res) => {
  try {
    const schools = await School.findAll({ where: { lgaId: req.params.lgaId } });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: "Error fetching schools" });
  }
});

export default router;