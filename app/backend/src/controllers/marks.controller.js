import { marksService } from '../services/marks.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getMarks = asyncHandler(async (req, res) => {
  const result = await marksService.getMarks(req.query, req.pagination);
  res.json({ success: true, data: result });
});

const createMark = asyncHandler(async (req, res) => {
  const mark = await marksService.createMark({
    ...req.body,
    createdBy: req.user.teacher?.id || req.user.admin?.id
  });
  res.status(201).json({ success: true, data: mark });
});

const getMark = asyncHandler(async (req, res) => {
  const mark = await marksService.getMark(req.params.id);
  res.json({ success: true, data: mark });
});

const updateMark = asyncHandler(async (req, res) => {
  const mark = await marksService.updateMark(req.params.id, req.body, req.user.id);
  res.json({ success: true, data: mark });
});

const deleteMark = asyncHandler(async (req, res) => {
  await marksService.deleteMark(req.params.id);
  res.json({ success: true, message: 'Mark deleted' });
});

const getStudentMarks = asyncHandler(async (req, res) => {
  const marks = await marksService.getStudentMarks(req.params.studentId, req.query);
  res.json({ success: true, data: marks });
});

const getClassRanking = asyncHandler(async (req, res) => {
  const ranking = await marksService.getClassRanking(
    req.params.classId,
    req.query.subjectId,
    req.query.examType
  );
  res.json({ success: true, data: ranking });
});

export const marksController = {
  getMarks,
  createMark,
  getMark,
  updateMark,
  deleteMark,
  getStudentMarks,
  getClassRanking
};
