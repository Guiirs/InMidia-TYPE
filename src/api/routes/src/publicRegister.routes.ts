/*
 * Arquivo: src/api/routes/src/publicRegister.routes.ts
 * Descrição: Define as rotas públicas de registo (ex: /api/empresas/register).
 * (Migração de routes/publicRegisterRoutes.js)
 *
 * Alterações (Melhoria de Robustez):
 * 1. [Confirmação] Este ficheiro está CORRETO e não necessita de alterações.
 * 2. [Segurança] Este router é montado em `/api/empresas` (conforme
 * `api/routes/index.ts`) e *intencionalmente* não usa `authMiddleware`
 * ou `apiKeyAuthMiddleware`, pois a rota de registo deve ser pública.
 * 3. [Robustez] O middleware `validate` (Zod) é aplicado corretamente
 * para garantir a integridade dos dados de entrada (validação do CNPJ,
 * email, senha) antes de chegarem ao controlador/serviço.
 */

import { Router } from 'express';
import { authController } from '@/api/controllers/src/auth.controller';
import { validate } from '@/security/middlewares/src/validate.middleware';
import { registerEmpresaSchema } from '@/utils/validators/auth.validator';
import { logger } from '@/config/logger';

/**
 * Define as rotas públicas de registo (ex: /api/empresas/register).
 * Estas rotas não requerem autenticação JWT.
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Registo Público...');

/**
 * @route   POST /api/empresas/register
 * @desc    Regista uma nova empresa e o seu utilizador admin
 * @access  Public
 */
router.post(
  '/register',
  validate(registerEmpresaSchema), // 1. Valida o DTO Zod
  authController.registerEmpresa, // 2. Chama o controlador
);

logger.info('[Routes] Rota POST /register (Pública) definida com validação.');

export const publicRegisterRoutes = router;