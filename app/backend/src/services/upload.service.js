import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppError } from '../middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'answer-sheets'), { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'announcements'), { recursive: true });
}

const getStorage = (subfolder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(uploadDir, subfolder);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitized);
  }
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const allowed = allowedTypes.map(t => `/${t}`);
  if (allowed.some(type => file.mimetype.includes(type))) {
    cb(null, true);
  } else {
    cb(new AppError(`Only ${allowedTypes.join(', ')} files are allowed`, 400, 'INVALID_FILE_TYPE'), false);
  }
};

const uploadPdfFile = multer({
  storage: getStorage('answer-sheets'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['pdf'])
});

const uploadImageFile = multer({
  storage: getStorage('announcements'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['png', 'jpeg', 'jpg'])
});

const uploadFile = async (req, res, type) => {
  return new Promise((resolve, reject) => {
    const uploadMiddleware = type === 'pdf' ? uploadPdfFile.single('file') : uploadImageFile.single('file');

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        reject(new AppError(`Upload error: ${err.message}`, 400, 'UPLOAD_ERROR'));
        return;
      }
      if (err) {
        reject(err);
        return;
      }
      if (!req.file) {
        reject(new AppError('No file uploaded', 400, 'NO_FILE'));
        return;
      }

      const fileUrl = `/uploads/${type === 'pdf' ? 'answer-sheets' : 'announcements'}/${req.file.filename}`;

      resolve({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size
      });
    });
  });
};

export const uploadService = {
  uploadFile
};
