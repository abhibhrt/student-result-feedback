const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate, authorize(['admin']));

router.get('/lookups', adminController.getLookups);
router.post('/department', adminController.createDepartment);
router.post('/subject', adminController.createSubject);
router.put('/subject/assign-faculty/:subjectId', adminController.assignFaculty);
router.post('/teacher', adminController.createTeacher);
router.post('/student', adminController.createStudent);
router.post('/exam/initialize', adminController.initializeSemesterExam);
router.post('/exam/publish', adminController.publishSemesterResults);

module.exports = router;