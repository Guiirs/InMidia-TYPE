/*
 * Arquivo: src/api/routes/src/cliente.routes.ts
 * Descrição: Define as rotas de gestão de Clientes.
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Adicionada a asserção `as any` a todos os métodos do
 * controlador que são chamados *após* o middleware `validate`.
 * 2. [REMOVIDO] `authMiddleware` foi removido (agora é global).
 */

import { Router } from 'express';
import { clienteController } from '@/api/controllers/src/cliente.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';
import { upload } from '@/security/middlewares/src/upload.middleware'; // Importa o Multer

// Validadores Zod (DTOs)
import {
  clienteBodySchema,
  updateClienteSchema,
  listClientesSchema,
} from '@/utils/validators/cliente.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Clientes (/clientes)...');

// Segurança (Auth/Admin) é aplicada em src/api/routes/index.ts

/**
 * @route   GET /api/v1/clientes
 * @desc    Busca todos os clientes (com paginação)
 * @access  Privado (Admin)
 */
router.get(
  '/',
  validate(listClientesSchema), // 1. Valida query params (Zod)
  clienteController.getAllClientes as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   POST /api/v1/clientes
 * @desc    Cria um novo cliente (com upload opcional de logo)
 * @access  Privado (Admin)
 */
router.post(
  '/',
  upload.single('logo'), // 1. Middleware Multer
  validate(clienteBodySchema), // 2. Valida o body (Zod)
  clienteController.createCliente as any, // 3. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/clientes/:id
 * @desc    Busca um cliente por ID
 * @access  Privado (Admin)
 */
router.get(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  clienteController.getClienteById as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   PUT /api/v1/clientes/:id
 * @desc    Atualiza um cliente (com upload opcional de logo)
 * @access  Privado (Admin)
 */
router.put(
  '/:id',
  upload.single('logo'), // 1. Middleware Multer
  validate(updateClienteSchema), // 2. Valida o body e params (Zod)
  clienteController.updateCliente as any, // 3. [FIX] Chama o controlador
);

/**
 * @route   DELETE /api/v1/clientes/:id
 * @desc    Apaga um cliente
 * @access  Privado (Admin)
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  clienteController.deleteCliente as any, // 2. [FIX] Chama o controlador
);

export const clienteRoutes = router;