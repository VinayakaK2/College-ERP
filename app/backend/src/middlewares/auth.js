import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { AppError, asyncHandler } from './errorHandler.js';
import { logger } from '../utils/logger.js';

const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') 
    ? req.headers.authorization.substring(7)
    : null;

  if (!token) {
    throw new AppError('Access token required', 401, 'MISSING_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        admin: true,
        teacher: {
          include: { subject: true, class: true, section: true }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401, 'INVALID_USER');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw err;
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} for role ${userRole}`);
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};

const requireAdmin = authorize('ADMIN');
const requireTeacher = authorize('ADMIN', 'TEACHER');
const requireParent = authorize('ADMIN', 'PARENT');

export { authenticate, authorize, requireAdmin, requireTeacher, requireParent };
