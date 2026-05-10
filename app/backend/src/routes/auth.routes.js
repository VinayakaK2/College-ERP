import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import {
  loginSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  parentLoginSchema,
  parentVerifyOtpSchema
} from '../validations/schemas.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/parent-login', validate(parentLoginSchema), authController.parentLogin);
router.post('/parent-verify-otp', validate(parentVerifyOtpSchema), authController.parentVerifyOtp);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
