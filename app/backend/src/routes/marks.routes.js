import { Router } from 'express';
import { marksController } from '../controllers/marks.controller.js';
import { authenticate, requireAdmin, requireTeacher } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createMarksSchema, updateMarksSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', marksController.getMarks);
router.post('/', requireTeacher, validate(createMarksSchema), marksController.createMark);
router.get('/:id', marksController.getMark);
router.put('/:id', requireTeacher, validate(updateMarksSchema), marksController.updateMark);
router.delete('/:id', requireAdmin, marksController.deleteMark);
router.get('/student/:studentId', marksController.getStudentMarks);
router.get('/ranking/:classId', marksController.getClassRanking);

export default router;
