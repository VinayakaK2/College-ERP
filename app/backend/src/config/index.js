import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  otpExpiresIn: parseInt(process.env.OTP_EXPIRES_IN, 10) || 300,
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  uploadPath: process.env.UPLOAD_PATH || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
};
