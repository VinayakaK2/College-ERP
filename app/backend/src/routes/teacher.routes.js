import { Router } from 'express';
import { teacherController } from '../controllers/teacher.controller.js';
import { authenticate, requireTeacher } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createMarksSchema, markAttendanceSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate, requireTeacher);

router.get('/dashboard', teacherController.getDashboard);
router.get('/students', teacherController.getAssignedStudents);
router.get('/subjects', teacherController.getAssignedSubjects);
router.post('/marks', validate(createMarksSchema), teacherController.createMark);
router.get('/marks', teacherController.getMyMarks);
router.post('/attendance', validate(markAttendanceSchema), teacherController.markAttendance);
router.get('/attendance-records', teacherController.getMyAttendanceRecords);

export default router;
