import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  logger.info(`Login attempt for ${email}`);
  res.json({ success: true, data: result });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOtp(email, otp);
  logger.info(`OTP verified for ${email}`);
  res.json({ success: true, data: result });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  res.json({ success: true, data: result });
});

const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  await authService.logout(userId);
  logger.info(`User ${userId} logged out`);
  res.json({ success: true, message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ success: true, data: user });
});

const parentLogin = asyncHandler(async (req, res) => {
  const { studentId, phone } = req.body;
  const result = await authService.parentLogin(studentId, phone);
  res.json({ success: true, data: result });
});

const parentVerifyOtp = asyncHandler(async (req, res) => {
  const { studentId, phone, otp } = req.body;
  const result = await authService.parentVerifyOtp(studentId, phone, otp);
  res.json({ success: true, data: result });
});

export const authController = {
  login,
  verifyOtp,
  refreshToken,
  logout,
  getMe,
  parentLogin,
  parentVerifyOtp
};
