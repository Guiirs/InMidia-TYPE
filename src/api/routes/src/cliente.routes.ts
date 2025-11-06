import { Router } from 'express';
import { clienteController } from '@/api/controllers/src/cliente.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { validate } from '@/security/middlewares/validate.middleware';
import { upload } from '@/security/middlewares/upload.middleware'; // Importa o Multer

// Validadores Zod (DTOs)
import {
  clienteBodySchema,
  updateClienteSchema,
  listClientesSchema,
} from '@/utils/validators/cliente.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator';

/**
 * Define as rotas de gestão de Clientes (ex: /api/v1/clientes/...).
 * (Migração de routes/clienteRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Clientes (/clientes)...');

// --- Middleware de Autenticação ---
// (Lógica do JS original)
router.use(authMiddleware);

/**
 * @route   GET /api/v1/clientes
 * @desc    Busca todos os clientes (com paginação)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/',
  validate(listClientesSchema), // 1. Valida query params (Zod)
  clienteController.getAllClientes, // 2. Chama o controlador
);

/**
 * @route   POST /api/v1/clientes
 * @desc    Cria um novo cliente (com upload opcional de logo)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.post(
  '/',
  upload.single('logo'), // 1. Middleware Multer
  validate(clienteBodySchema), // 2. Valida o body (Zod)
  clienteController.createCliente, // 3. Chama o controlador
);

/**
 * @route   GET /api/v1/clientes/:id
 * @desc    Busca um cliente por ID
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  clienteController.getClienteById, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/clientes/:id
 * @desc    Atualiza um cliente (com upload opcional de logo)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.put(
  '/:id',
  upload.single('logo'), // 1. Middleware Multer
  validate(updateClienteSchema), // 2. Valida o body e params (Zod)
  clienteController.updateCliente, // 3. Chama o controlador
);

/**
 * @route   DELETE /api/v1/clientes/:id
 * @desc    Apaga um cliente
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  clienteController.deleteCliente, // 2. Chama o controlador
);

export const clienteRoutes = router;