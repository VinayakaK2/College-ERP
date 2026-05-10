import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validate, paginationSchema } from '../middlewares/validate.js';
import { createTeacherSchema, createSubjectSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/teachers', paginationSchema, adminController.getTeachers);
router.post('/teachers', validate(createTeacherSchema), adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', validate(createSubjectSchema), adminController.createSubject);
router.get('/audit-logs', paginationSchema, adminController.getAuditLogs);

export default router;
