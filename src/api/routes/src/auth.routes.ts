import { Router } from 'express';
import { z } from 'zod'; // (Usado para o schema inline de verify-token)
import { authController } from '@/api/controllers/src/auth.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/validate.middleware';
import { loginLimiter } from '@/security/middlewares/rateLimit.middleware';

// Validadores Zod (DTOs)
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/utils/validators/auth.validator';

/**
 * Define as rotas de autenticação (ex: /api/v1/auth/...).
 * (Migração de routes/auth.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Autenticação...');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de utilizador
 * @access  Public
 * (Migração de)
 */
router.post(
  '/login',
  loginLimiter, // 1. Aplica Rate Limit (Fase 1)
  validate(loginSchema), // 2. Valida o body (Zod)
  authController.login, // 3. Chama o controlador
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Solicita redefinição de senha
 * @access  Public
 * (Migração de)
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema), // 1. Valida o body (Zod)
  authController.forgotPassword, // 2. Chama o controlador
);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Redefine a senha usando um token
 * @access  Public
 * (Migração de)
 */
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema), // 1. Valida params.token e body.newPassword
  authController.resetPassword, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/auth/verify-token/:token
 * @desc    Verifica se um token de redefinição é válido
 * @access  Public
 * (Migração de)
 */
router.get(
  '/verify-token/:token',
  // Reutiliza a validação de 'token' do resetPasswordSchema
  validate(z.object({ params: resetPasswordSchema.shape.params })),
  authController.verifyResetToken,
);

export const authRoutes = router;