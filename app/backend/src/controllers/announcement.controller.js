import { announcementService } from '../services/announcement.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementService.getAnnouncements(req.query, req.pagination);
  res.json({ success: true, data: result });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement({
    ...req.body,
    createdBy: req.user.id
  });
  res.status(201).json({ success: true, data: announcement });
});

const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncement(req.params.id);
  res.json({ success: true, data: announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  await announcementService.deleteAnnouncement(req.params.id);
  res.json({ success: true, message: 'Announcement deleted' });
});

export const announcementController = {
  getAnnouncements,
  createAnnouncement,
  getAnnouncement,
  deleteAnnouncement
};
