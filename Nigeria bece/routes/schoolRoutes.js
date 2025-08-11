const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');

router.post('/', schoolController.createSchool);
router.get('/', schoolController.getSchools);
router.get('/:id', schoolController.getSchool);
router.put('/:id', schoolController.updateSchool);
router.delete('/:id', schoolController.deleteSchool);

module.exports = router;
