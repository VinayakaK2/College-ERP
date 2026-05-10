import { feesService } from '../services/fees.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const getFees = asyncHandler(async (req, res) => {
  const result = await feesService.getFees(req.query, req.pagination);
  res.json({ success: true, data: result });
});

const createFee = asyncHandler(async (req, res) => {
  const fee = await feesService.createFee(req.body);
  res.status(201).json({ success: true, data: fee });
});

const getFee = asyncHandler(async (req, res) => {
  const fee = await feesService.getFee(req.params.id);
  res.json({ success: true, data: fee });
});

const updateFee = asyncHandler(async (req, res) => {
  const fee = await feesService.updateFee(req.params.id, req.body);
  res.json({ success: true, data: fee });
});

const recordPayment = asyncHandler(async (req, res) => {
  const fee = await feesService.recordPayment(req.params.id, req.body);
  res.json({ success: true, data: fee });
});

const getStudentFees = asyncHandler(async (req, res) => {
  const fees = await feesService.getStudentFees(req.params.studentId);
  res.json({ success: true, data: fees });
});

export const feesController = {
  getFees,
  createFee,
  getFee,
  updateFee,
  recordPayment,
  getStudentFees
};
