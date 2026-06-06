import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { LoginSchema, RegisterSchema, RefreshTokenSchema } from '@vendorbridge/shared';

export const authRoutes = Router();

authRoutes.post('/register', authLimiter, validate(RegisterSchema), authController.register);
authRoutes.post('/login', authLimiter, validate(LoginSchema), authController.login);
authRoutes.post('/refresh', validate(RefreshTokenSchema), authController.refresh);
authRoutes.post('/logout', authenticate, authController.logout);
authRoutes.get('/profile', authenticate, authController.getProfile);
