import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import studentRoutes from './routes/student.routes.js';
import classRoutes from './routes/class.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import marksRoutes from './routes/marks.routes.js';
import feesRoutes from './routes/fees.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import parentRoutes from './routes/parent.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      errorCode: 'RATE_LIMITED'
    });
  }
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts',
      errorCode: 'AUTH_RATE_LIMITED'
    });
  }
});

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/uploads', express.static(config.uploadPath));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'College ERP API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errorCode: 'NOT_FOUND'
  });
});

app.use(errorHandler);

export { app };
