import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);

router.post('/pdf', uploadController.uploadPdf);
router.post('/image', uploadController.uploadImage);

export default router;
