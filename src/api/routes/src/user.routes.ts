/*
 * Arquivo: src/api/routes/src/user.routes.ts
 * Descrição: Define as rotas do Utilizador autenticado (ex: /api/v1/user/...).
 * (Migração de routes/user.js)
 *
 * Alterações (Melhoria de Robustez):
 * 1. [REMOVIDO] Removida a importação de `authMiddleware`.
 * 2. [REMOVIDO] Removido o `router.use(authMiddleware)`.
 * 3. [MANTIDO] O `adminMiddleware` é mantido e aplicado *localmente*
 * às rotas que exigem permissão de Admin.
 *
 * Motivo: A autenticação (JWT) já é aplicada globalmente a este
 * grupo de rotas (`/v1/user`) no ficheiro `src/api/routes/index.ts`.
 * A autorização (Admin) é necessária apenas para sub-rotas específicas.
 */

import { Router } from 'express';
// [CORRIGIDO] Importa o controlador corrigido
import { userController } from '@/api/controllers/src/user.controller';
import { logger } from '@/config/logger';

// Middlewares
// [REMOVIDO] import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { adminMiddleware } from '@/security/middlewares/src/admin.middleware'; // [MANTIDO]
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import {
  updateUserProfileSchema,
  regenerateApiKeySchema,
} from '@/utils/validators/user.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Utilizador (/user)...');

// --- Middleware de Autenticação ---
// [REMOVIDO] router.use(authMiddleware);
// (A autenticação JWT é aplicada globalmente em src/api/routes/index.ts)

/**
 * @route   GET /api/v1/user/me
 * @desc    Perfil do Utilizador
 * @access  Privado (Utilizador autenticado)
 */
router.get(
  '/me',
  userController.getProfile, // 1. Chama o controlador
);

/**
 * @route   PUT /api/v1/user/me
 * @desc    Atualiza Perfil do Utilizador
 * @access  Privado (Utilizador autenticado)
 */
router.put(
  '/me',
  validate(updateUserProfileSchema), // 1. Valida o body (Zod)
  userController.updateProfile, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/user/me/empresa
 * @desc    Perfil da Empresa (Apenas Admin)
 * @access  Privado (Admin)
 */
router.get(
  '/me/empresa',
  adminMiddleware, // 1. Garante que é Admin [MANTIDO]
  // [CORRIGIDO] Este método agora existe no userController
  userController.getEmpresaProfile, // 2. Chama o controlador
);

/**
 * @route   POST /api/v1/user/me/empresa/regenerate-api-key
 * @desc    Regenera API Key (Apenas Admin)
 * @access  Privado (Admin)
 */
router.post(
  '/me/empresa/regenerate-api-key',
  adminMiddleware, // 1. Garante que é Admin [MANTIDO]
  validate(regenerateApiKeySchema), // 2. Valida o body (Zod)
  // [CORRIGIDO] Este método agora existe no userController
  userController.regenerateApiKey, // 3. Chama o controlador
);

export const userRoutes = router;