import { Router } from 'express';
import { parentController } from '../controllers/parent.controller.js';
import { authenticate, requireParent } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate, requireParent);

router.get('/dashboard', parentController.getDashboard);
router.get('/attendance', parentController.getChildAttendance);
router.get('/marks', parentController.getChildMarks);
router.get('/fees', parentController.getChildFees);
router.get('/announcements', parentController.getAnnouncements);

export default router;
