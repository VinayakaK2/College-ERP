import { adminService } from '../services/admin.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
});

const getTeachers = asyncHandler(async (req, res) => {
  const result = await adminService.getTeachers(req.pagination);
  res.json({ success: true, data: result });
});

const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await adminService.createTeacher(req.body);
  res.status(201).json({ success: true, data: teacher });
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await adminService.updateTeacher(req.params.id, req.body);
  res.json({ success: true, data: teacher });
});

const deleteTeacher = asyncHandler(async (req, res) => {
  await adminService.deleteTeacher(req.params.id);
  res.json({ success: true, message: 'Teacher deleted' });
});

const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await adminService.getSubjects();
  res.json({ success: true, data: subjects });
});

const createSubject = asyncHandler(async (req, res) => {
  const subject = await adminService.createSubject(req.body);
  res.status(201).json({ success: true, data: subject });
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await adminService.getAuditLogs(req.pagination);
  res.json({ success: true, data: result });
});

export const adminController = {
  getDashboard,
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getSubjects,
  createSubject,
  getAuditLogs
};
