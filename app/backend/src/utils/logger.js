import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  defaultMeta: { service: 'college-erp' },
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp(),
        colorize(),
        config.env === 'development' ? devFormat : json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json(), errors({ stack: true })),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

export { logger };
