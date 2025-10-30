// routes/apiRoutes.js
import express from 'express';
import { LGA } from '../models/index.js';

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

export default router;
