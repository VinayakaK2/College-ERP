import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import { generateOtp, verifyOtpCode } from '../helpers/otp.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiresIn
  });
  return { accessToken, refreshToken };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn(`Invalid password attempt for: ${email}`);
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Account deactivated', 403, 'ACCOUNT_DEACTIVATED');
  }

  const otpResult = generateOtp();
  
  await prisma.otpSession.create({
    data: {
      userId: user.id,
      otp: otpResult.code,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + config.otpExpiresIn * 1000),
      maxAttempts: config.otpMaxAttempts
    }
  });

  logger.info(`OTP generated for ${email}`);

  return {
    message: 'OTP sent to your registered contact',
    email: user.email,
    otp: config.env === 'development' ? otpResult.code : undefined,
    expiresIn: config.otpExpiresIn
  };
};

const verifyOtp = async (email, otpCode) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      admin: true,
      teacher: {
        include: { subject: true, class: true, section: true }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const otpSession = await prisma.otpSession.findFirst({
    where: {
      userId: user.id,
      purpose: 'LOGIN',
      verified: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpSession) {
    throw new AppError('OTP expired or not found', 400, 'OTP_EXPIRED');
  }

  if (otpSession.attempts >= otpSession.maxAttempts) {
    throw new AppError('Maximum OTP attempts exceeded', 400, 'MAX_ATTEMPTS');
  }

  await prisma.otpSession.update({
    where: { id: otpSession.id },
    data: { attempts: { increment: 1 } }
  });

  if (otpSession.otp !== otpCode) {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  await prisma.otpSession.update({
    where: { id: otpSession.id },
    data: { verified: true }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const tokens = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const { passwordHash, ...userWithoutPassword } = user;

  return {
    message: 'Login successful',
    user: userWithoutPassword,
    ...tokens
  };
};

const refreshToken = async (token) => {
  if (!token) {
    throw new AppError('Refresh token required', 401, 'MISSING_REFRESH_TOKEN');
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const decoded = jwt.verify(token, config.jwtSecret);
  if (decoded.type !== 'refresh') {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const tokens = generateTokens(storedToken.userId);

  await prisma.refreshToken.delete({ where: { token } });
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: storedToken.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return tokens;
};

const logout = async (userId) => {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
  return true;
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      admin: true,
      teacher: {
        include: { subject: true, class: true, section: true }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const parentLogin = async (studentId, phone) => {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: { parents: true }
  });

  if (!student) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  const parent = student.parents.find(p => p.phone === phone);
  if (!parent) {
    throw new AppError('No parent found with this phone number', 404, 'PARENT_NOT_FOUND');
  }

  const otpResult = generateOtp();
  
  const tempUserId = `parent_${parent.id}`;
  
  return {
    message: 'OTP sent to parent phone',
    studentId,
    phone,
    otp: config.env === 'development' ? otpResult.code : undefined,
    expiresIn: config.otpExpiresIn
  };
};

const parentVerifyOtp = async (studentId, phone, otpCode) => {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      parents: true,
      class: true,
      section: true
    }
  });

  if (!student) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  const parent = student.parents.find(p => p.phone === phone);
  if (!parent) {
    throw new AppError('Parent not found', 404, 'NOT_FOUND');
  }

  const now = new Date();
  const parentUser = {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    phone: parent.phone,
    role: 'PARENT',
    studentId: student.id,
    student: student,
    isParent: true
  };

  const accessToken = jwt.sign(
    { userId: parent.id, role: 'PARENT', studentId: student.id },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    message: 'Login successful',
    user: parentUser,
    accessToken
  };
};

export const authService = {
  login,
  verifyOtp,
  refreshToken,
  logout,
  getMe,
  parentLogin,
  parentVerifyOtp
};
