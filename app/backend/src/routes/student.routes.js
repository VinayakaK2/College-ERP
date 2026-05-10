import { Router } from 'express';
import { studentController } from '../controllers/student.controller.js';
import { authenticate, requireAdmin, requireTeacher } from '../middlewares/auth.js';
import { validate, paginationSchema } from '../middlewares/validate.js';
import { createStudentSchema, updateStudentSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', requireAdmin, paginationSchema, studentController.getStudents);
router.get('/:id', requireTeacher, studentController.getStudent);
router.post('/', requireAdmin, validate(createStudentSchema), studentController.createStudent);
router.put('/:id', requireAdmin, validate(updateStudentSchema), studentController.updateStudent);
router.delete('/:id', requireAdmin, studentController.deleteStudent);
router.get('/:id/performance', requireTeacher, studentController.getStudentPerformance);
router.get('/:id/attendance', requireTeacher, studentController.getStudentAttendance);

export default router;
