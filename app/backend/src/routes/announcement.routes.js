import { Router } from 'express';
import { announcementController } from '../controllers/announcement.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validate, paginationSchema } from '../middlewares/validate.js';
import { createAnnouncementSchema } from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', paginationSchema, announcementController.getAnnouncements);
router.post('/', requireAdmin, validate(createAnnouncementSchema), announcementController.createAnnouncement);
router.get('/:id', announcementController.getAnnouncement);
router.delete('/:id', requireAdmin, announcementController.deleteAnnouncement);

export default router;
