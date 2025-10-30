// controllers/schoolController.js
import { School } from '../models/index.js';

export const createSchool = async (req, res) => {
  try {
    const school = await School.create(req.body);
    res.status(201).json(school);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSchools = async (req, res) => {
  try {
    const schools = await School.findAll();
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSchool = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) return res.status(404).json({ error: 'School not found' });

    await school.update(req.body);
    res.json(school);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) return res.status(404).json({ error: 'School not found' });

    await school.destroy();
    res.json({ message: 'School deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
