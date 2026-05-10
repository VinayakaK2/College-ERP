import { AppError } from './errorHandler.js';

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      throw new AppError(messages, 400, 'VALIDATION_ERROR');
    }
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      throw new AppError(messages, 400, 'VALIDATION_ERROR');
    }
    next();
  };
};

const paginationSchema = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};

export { validate, validateQuery, paginationSchema };
