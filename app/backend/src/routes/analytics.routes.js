import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardAnalytics);
router.get('/class/:classId', analyticsController.getClassAnalytics);
router.get('/student/:studentId', analyticsController.getStudentAnalytics);
router.get('/attendance', analyticsController.getAttendanceAnalytics);
router.get('/fees', analyticsController.getFeesAnalytics);

export default router;
