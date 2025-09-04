// routes/school.js
import express from 'express';
import schoolController from '../controllers/schoolController.js';

const router = express.Router();

router.post('/', schoolController.createSchool);
router.get('/', schoolController.getSchools);
router.get('/:id', schoolController.getSchool);
router.put('/:id', schoolController.updateSchool);
router.delete('/:id', schoolController.deleteSchool);

export default router;
