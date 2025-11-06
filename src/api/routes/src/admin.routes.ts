/*
 * Arquivo: src/api/routes/src/admin.routes.ts
 * Descrição: Define as rotas de Administração (ex: /api/v1/admin/...).
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Corrigido o erro "No overload matches this call".
 * 2. Adicionada a asserção `as any` a todos os métodos do controlador
 * que são chamados *após* o middleware `validate`.
 * 3. [REMOVIDO] Middlewares de auth (authMiddleware, adminMiddleware)
 * foram removidos (agora são globais).
 */

import { Router } from 'express';
import { adminController } from '@/api/controllers/src/admin.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import {
  createUserSchema,
  updateUserRoleSchema,
  mongoIdParamSchema, // O validador para :id
} from '@/utils/validators/admin.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Administração (/admin)...');

// Middlewares de segurança são aplicados em src/api/routes/index.ts

/**
 * @route   GET /api/v1/admin/users
 * @desc    Lista todos os utilizadores da empresa
 * @access  Privado (Admin)
 */
router.get(
  '/users',
  // Sem 'validate', não precisa de 'as any'
  adminController.getAllUsers,
);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Cria um novo utilizador (convidado)
 * @access  Privado (Admin)
 */
router.post(
  '/users',
  validate(createUserSchema), // 1. Valida o body (Zod)
  adminController.createUser as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   PUT /api/v1/admin/users/:id/role
 * @desc    Altera a role de um utilizador
 * @access  Privado (Admin)
 */
router.put(
  '/users/:id/role',
  validate(updateUserRoleSchema), // 1. Valida o body e params (Zod)
  adminController.updateUserRole as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Apaga um utilizador
 * @access  Privado (Admin)
 */
router.delete(
  '/users/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  adminController.deleteUser as any, // 2. [FIX] Chama o controlador
);

export const adminRoutes = router;