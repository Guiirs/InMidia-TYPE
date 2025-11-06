import { Router } from 'express';
import { adminController } from '@/api/controllers/src/admin.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { adminMiddleware } from '@/security/middlewares/admin.middleware';
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import {
  createUserSchema,
  updateUserRoleSchema,
  mongoIdParamSchema, // O validador para :id
} from '@/utils/validators/admin.validator';

/**
 * Define as rotas de Administração (ex: /api/v1/admin/...).
 * (Migração de routes/adminRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Administração (/admin)...');

// --- Middlewares Aplicados a Todas as Rotas /admin ---
// (Lógica do JS original)
router.use(authMiddleware); // 1. Verifica se está autenticado
router.use(adminMiddleware); // 2. Verifica se é Admin

/**
 * @route   GET /api/v1/admin/users
 * @desc    Lista todos os utilizadores da empresa
 * @access  Privado (Admin)
 * (Migração de)
 */
router.get(
  '/users',
  adminController.getAllUsers, // Chama o controlador
);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Cria um novo utilizador (convidado)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.post(
  '/users',
  validate(createUserSchema), // 1. Valida o body (Zod)
  adminController.createUser, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/admin/users/:id/role
 * @desc    Altera a role de um utilizador
 * @access  Privado (Admin)
 * (Migração de)
 */
router.put(
  '/users/:id/role',
  validate(updateUserRoleSchema), // 1. Valida o body e params (Zod)
  adminController.updateUserRole, // 2. Chama o controlador
);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Apaga um utilizador
 * @access  Privado (Admin)
 * (Migração de)
 */
router.delete(
  '/users/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  adminController.deleteUser, // 2. Chama o controlador
);

export const adminRoutes = router;