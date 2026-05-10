import { PrismaClient } from '@prisma/client';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: config.env === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

prisma.$connect()
  .then(() => logger.info('Connected to PostgreSQL database'))
  .catch((err) => logger.error('Failed to connect to database:', err));

export { prisma };
