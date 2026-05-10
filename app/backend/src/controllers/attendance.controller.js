import { attendanceService } from '../services/attendance.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getAttendance = asyncHandler(async (req, res) => {
  const { classId, sectionId, subjectId, date, startDate, endDate } = req.query;
  const result = await attendanceService.getAttendance({
    classId, sectionId, subjectId, date, startDate, endDate
  }, req.pagination);
  res.json({ success: true, data: result });
});

const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { classId, sectionId, subjectId, month, year } = req.query;
  const summary = await attendanceService.getAttendanceSummary({
    classId, sectionId, subjectId, month, year
  });
  res.json({ success: true, data: summary });
});

const markAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.markAttendance({
    ...req.body,
    teacherId: req.user.teacher?.id
  });
  res.status(201).json({ success: true, data: result });
});

const updateAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.updateAttendance(req.params.id, req.body);
  res.json({ success: true, data: result });
});

const getStudentAttendance = asyncHandler(async (req, res) => {
  const { month, year, subjectId } = req.query;
  const result = await attendanceService.getStudentAttendance(
    req.params.studentId,
    { month, year, subjectId }
  );
  res.json({ success: true, data: result });
});

export const attendanceController = {
  getAttendance,
  getAttendanceSummary,
  markAttendance,
  updateAttendance,
  getStudentAttendance
};
