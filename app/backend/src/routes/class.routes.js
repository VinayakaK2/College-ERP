import { Router } from 'express';
import { classController } from '../controllers/class.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createClassSchema, createSectionSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', classController.getClasses);
router.post('/', requireAdmin, validate(createClassSchema), classController.createClass);
router.get('/:id', classController.getClass);
router.delete('/:id', requireAdmin, classController.deleteClass);
router.get('/:id/sections', classController.getSections);
router.post('/sections', requireAdmin, validate(createSectionSchema), classController.createSection);
router.get('/:id/students', classController.getClassStudents);

export default router;
