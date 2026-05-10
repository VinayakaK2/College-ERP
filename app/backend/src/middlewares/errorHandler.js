import { logger } from '../utils/logger.js';

class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  if (err.name === 'ValidationError' || err.isJoi) {
    statusCode = 400;
    message = err.message;
    errorCode = 'VALIDATION_ERROR';
  }

  if (err.name === 'UnauthorizedError' || err.message?.includes('jwt')) {
    statusCode = 401;
    message = 'Authentication required';
    errorCode = 'UNAUTHORIZED';
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      statusCode = 409;
      const field = err.meta?.target?.[0] || 'field';
      message = `${field} already exists`;
      errorCode = 'DUPLICATE_ENTRY';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
      errorCode = 'NOT_FOUND';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference to related record';
      errorCode = 'FOREIGN_KEY_VIOLATION';
    } else {
      statusCode = 500;
      message = 'Database error';
      errorCode = 'DATABASE_ERROR';
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
    errorCode = 'VALIDATION_ERROR';
  }

  logger.error({
    message: err.message,
    errorCode,
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    ...(isDev && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { errorHandler, AppError, asyncHandler };
