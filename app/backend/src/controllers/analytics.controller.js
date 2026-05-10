import { analyticsService } from '../services/analytics.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDashboardAnalytics();
  res.json({ success: true, data });
});

const getClassAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getClassAnalytics(req.params.classId);
  res.json({ success: true, data });
});

const getStudentAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getStudentAnalytics(req.params.studentId);
  res.json({ success: true, data });
});

const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const { classId, sectionId, month, year } = req.query;
  const data = await analyticsService.getAttendanceAnalytics({ classId, sectionId, month, year });
  res.json({ success: true, data });
});

const getFeesAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getFeesAnalytics();
  res.json({ success: true, data });
});

export const analyticsController = {
  getDashboardAnalytics,
  getClassAnalytics,
  getStudentAnalytics,
  getAttendanceAnalytics,
  getFeesAnalytics
};
