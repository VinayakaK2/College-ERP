import { teacherService } from '../services/teacher.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  const data = await teacherService.getDashboard(teacherId);
  res.json({ success: true, data });
});

const getAssignedStudents = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  const students = await teacherService.getAssignedStudents(teacherId, req.query);
  res.json({ success: true, data: students });
});

const getAssignedSubjects = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  const subjects = await teacherService.getAssignedSubjects(teacherId);
  res.json({ success: true, data: subjects });
});

const createMark = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  const mark = await teacherService.createMark({
    ...req.body,
    createdBy: teacherId
  });
  res.status(201).json({ success: true, data: mark });
});

const getMyMarks = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  const marks = await teacherService.getMyMarks(teacherId, req.query);
  res.json({ success: true, data: marks });
});

const markAttendance = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  const result = await teacherService.markAttendance({
    ...req.body,
    teacherId
  });
  res.status(201).json({ success: true, data: result });
});

const getMyAttendanceRecords = asyncHandler(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  const records = await teacherService.getMyAttendanceRecords(teacherId, req.query);
  res.json({ success: true, data: records });
});

export const teacherController = {
  getDashboard,
  getAssignedStudents,
  getAssignedSubjects,
  createMark,
  getMyMarks,
  markAttendance,
  getMyAttendanceRecords
};
