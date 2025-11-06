import { Router } from 'express';
import { authController } from '@/api/controllers/src/auth.controller';
import { validate } from '@/security/middlewares/validate.middleware';
import { registerEmpresaSchema } from '@/utils/validators/auth.validator';
import { logger } from '@/config/logger';

/**
 * Define as rotas públicas de registo (ex: /api/empresas/register).
 * Estas rotas não requerem autenticação JWT.
 * (Migração de routes/publicRegisterRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Registo Público...');

/**
 * @route   POST /api/empresas/register
 * @desc    Regista uma nova empresa e o seu utilizador admin
 * @access  Public
 * (Migração de)
 */
router.post(
  '/register',
  validate(registerEmpresaSchema), // 1. Valida o DTO Zod
  authController.registerEmpresa, // 2. Chama o controlador
);

logger.info('[Routes] Rota POST /register (Pública) definida com validação.');

export const publicRegisterRoutes = router;