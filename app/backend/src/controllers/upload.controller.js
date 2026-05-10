import { uploadService } from '../services/upload.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const uploadPdf = asyncHandler(async (req, res) => {
  const result = await uploadService.uploadFile(req, res, 'pdf');
  res.json({ success: true, data: result });
});

const uploadImage = asyncHandler(async (req, res) => {
  const result = await uploadService.uploadFile(req, res, 'image');
  res.json({ success: true, data: result });
});

export const uploadController = {
  uploadPdf,
  uploadImage
};
