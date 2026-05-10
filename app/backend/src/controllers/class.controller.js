import { classService } from '../services/class.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getClasses();
  res.json({ success: true, data: classes });
});

const createClass = asyncHandler(async (req, res) => {
  const cls = await classService.createClass(req.body);
  res.status(201).json({ success: true, data: cls });
});

const getClass = asyncHandler(async (req, res) => {
  const cls = await classService.getClass(req.params.id);
  res.json({ success: true, data: cls });
});

const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.json({ success: true, message: 'Class deleted' });
});

const getSections = asyncHandler(async (req, res) => {
  const sections = await classService.getSections(req.params.id);
  res.json({ success: true, data: sections });
});

const createSection = asyncHandler(async (req, res) => {
  const section = await classService.createSection(req.body);
  res.status(201).json({ success: true, data: section });
});

const getClassStudents = asyncHandler(async (req, res) => {
  const students = await classService.getClassStudents(req.params.id, req.query.sectionId);
  res.json({ success: true, data: students });
});

export const classController = {
  getClasses,
  createClass,
  getClass,
  deleteClass,
  getSections,
  createSection,
  getClassStudents
};
