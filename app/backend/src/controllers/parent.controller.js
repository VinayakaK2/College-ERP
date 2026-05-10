import { parentService } from '../services/parent.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user.studentId;
  const data = await parentService.getDashboard(studentId);
  res.json({ success: true, data });
});

const getChildAttendance = asyncHandler(async (req, res) => {
  const studentId = req.user.studentId;
  const { month, year, subjectId } = req.query;
  const data = await parentService.getChildAttendance(studentId, { month, year, subjectId });
  res.json({ success: true, data });
});

const getChildMarks = asyncHandler(async (req, res) => {
  const studentId = req.user.studentId;
  const { subjectId, examType } = req.query;
  const data = await parentService.getChildMarks(studentId, { subjectId, examType });
  res.json({ success: true, data });
});

const getChildFees = asyncHandler(async (req, res) => {
  const studentId = req.user.studentId;
  const data = await parentService.getChildFees(studentId);
  res.json({ success: true, data });
});

const getAnnouncements = asyncHandler(async (req, res) => {
  const data = await parentService.getAnnouncements();
  res.json({ success: true, data });
});

export const parentController = {
  getDashboard,
  getChildAttendance,
  getChildMarks,
  getChildFees,
  getAnnouncements
};
