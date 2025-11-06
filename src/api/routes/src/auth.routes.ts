/*
 * Arquivo: src/api/routes/src/auth.routes.ts
 * Descrição: Define as rotas de autenticação (ex: /api/v1/auth/...).
 *
 * Alterações (Correção de Bug TS2339 e TS2769):
 * 1. [FIX TS2769] Adicionada a asserção `as any` a todos os métodos do
 * controlador que são chamados *após* o middleware `validate`.
 * 2. [FIX TS2339] Corrigido o erro "Property 'shape' does not exist"
 * na rota 'GET /verify-token/:token'.
 * 3. Motivo: Não podemos usar '.shape' no 'resetPasswordSchema'
 * porque ele é um 'ZodEffects' (devido ao '.refine()').
 * 4. Solução: Criado um novo schema inline 'z.object({ params: ... })'
 * simples e correto (que é um ZodObject) para essa rota.
 */

import { Router } from 'express';
import { z } from 'zod'; // Importa o 'z'
import { authController } from '@/api/controllers/src/auth.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';
import { loginLimiter } from '@/security/middlewares/src/rateLimit.middleware';

// Validadores Zod (DTOs)
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/utils/validators/auth.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Autenticação...');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de utilizador
 * @access  Public
 */
router.post(
  '/login',
  loginLimiter, // 1. Aplica Rate Limit
  validate(loginSchema), // 2. Valida o body (Zod)
  authController.login as any, // 3. [FIX TS2769]
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Solicita redefinição de senha
 * @access  Public
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema), // 1. Valida o body (Zod)
  authController.forgotPassword as any, // 2. [FIX TS2769]
);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Redefine a senha usando um token
 * @access  Public
 */
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema), // 1. Valida (Este é um ZodEffects, o que está OK)
  authController.resetPassword as any, // 2. [FIX TS2769]
);

/**
 * @route   GET /api/v1/auth/verify-token/:token
 * @desc    Verifica se um token de redefinição é válido
 * @access  Public
 */
router.get(
  '/verify-token/:token',
  // [FIX TS2339] Cria um schema inline simples (ZodObject)
  // em vez de tentar aceder a '.shape' de um ZodEffects.
  validate(
    z.object({
      params: z.object({
        token: z.string({ required_error: 'O token é obrigatório.' }),
      }),
    }),
  ),
  authController.verifyResetToken as any, // [FIX TS2769]
);

export const authRoutes = router;