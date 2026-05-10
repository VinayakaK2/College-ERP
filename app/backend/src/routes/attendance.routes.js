import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller.js';
import { authenticate, requireAdmin, requireTeacher } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { markAttendanceSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', attendanceController.getAttendance);
router.get('/summary', attendanceController.getAttendanceSummary);
router.post('/', requireTeacher, validate(markAttendanceSchema), attendanceController.markAttendance);
router.put('/:id', requireTeacher, attendanceController.updateAttendance);
router.get('/student/:studentId', attendanceController.getStudentAttendance);

export default router;
