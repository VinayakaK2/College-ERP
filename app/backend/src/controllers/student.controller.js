import { studentService } from '../services/student.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getStudents = asyncHandler(async (req, res) => {
  const { classId, sectionId, search, status } = req.query;
  const result = await studentService.getStudents(
    { classId, sectionId, search, status },
    req.pagination
  );
  res.json({ success: true, data: result });
});

const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getStudent(req.params.id);
  res.json({ success: true, data: student });
});

const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);
  res.status(201).json({ success: true, data: student });
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  res.json({ success: true, data: student });
});

const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id);
  res.json({ success: true, message: 'Student removed' });
});

const getStudentPerformance = asyncHandler(async (req, res) => {
  const performance = await studentService.getStudentPerformance(req.params.id);
  res.json({ success: true, data: performance });
});

const getStudentAttendance = asyncHandler(async (req, res) => {
  const { month, year, subjectId } = req.query;
  const attendance = await studentService.getStudentAttendance(
    req.params.id,
    { month, year, subjectId }
  );
  res.json({ success: true, data: attendance });
});

export const studentController = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPerformance,
  getStudentAttendance
};
