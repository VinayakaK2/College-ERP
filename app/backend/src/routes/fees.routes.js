import { Router } from 'express';
import { feesController } from '../controllers/fees.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createFeeSchema, recordPaymentSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', feesController.getFees);
router.post('/', requireAdmin, validate(createFeeSchema), feesController.createFee);
router.get('/:id', feesController.getFee);
router.put('/:id', requireAdmin, feesController.updateFee);
router.post('/:id/payment', requireAdmin, validate(recordPaymentSchema), feesController.recordPayment);
router.get('/student/:studentId', feesController.getStudentFees);

export default router;
