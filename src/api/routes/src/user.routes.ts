import { Router } from 'express';
import { userController } from '@/api/controllers/src/user.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { adminMiddleware } from '@/security/middlewares/admin.middleware';
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import {
  updateUserProfileSchema,
  regenerateApiKeySchema,
} from '@/utils/validators/user.validator';

/**
 * Define as rotas do Utilizador autenticado (ex: /api/v1/user/...).
 * (Migração de routes/user.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Utilizador (/user)...');

// --- Middleware de Autenticação ---
// Aplica a todas as rotas deste ficheiro (lógica do JS)
router.use(authMiddleware);

/**
 * @route   GET /api/v1/user/me
 * @desc    Perfil do Utilizador
 * @access  Privado (Utilizador autenticado)
 * (Migração de)
 */
router.get(
  '/me',
  userController.getProfile, // 1. Chama o controlador
);

/**
 * @route   PUT /api/v1/user/me
 * @desc    Atualiza Perfil do Utilizador
 * @access  Privado (Utilizador autenticado)
 * (Migração de)
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
 * (Migração de)
 */
router.get(
  '/me/empresa',
  adminMiddleware, // 1. Garante que é Admin
  userController.getEmpresaProfile, // 2. Chama o controlador
);

/**
 * @route   POST /api/v1/user/me/empresa/regenerate-api-key
 * @desc    Regenera API Key (Apenas Admin)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.post(
  '/me/empresa/regenerate-api-key',
  adminMiddleware, // 1. Garante que é Admin
  validate(regenerateApiKeySchema), // 2. Valida o body (Zod)
  userController.regenerateApiKey, // 3. Chama o controlador
);

export const userRoutes = router;