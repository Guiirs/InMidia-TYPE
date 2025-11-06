import { Router } from 'express';
import { contratoController } from '@/api/controllers/src/contrato.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import {
  createContratoSchema,
  updateContratoSchema,
  listContratosSchema,
  getContratoSchema, // (Validador para :id)
} from '@/utils/validators/contrato.validator';

/**
 * Define as rotas de gestão de Contratos (ex: /api/v1/contratos/...).
 * (Migração de routes/contratoRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Contratos (/contratos)...');

// --- Middleware de Autenticação ---
// (Lógica do JS original)
router.use(authMiddleware);

/**
 * @route   POST /api/v1/contratos
 * @desc    Cria um contrato a partir de uma PI
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.post(
  '/',
  validate(createContratoSchema), // 1. Valida o piId no body
  contratoController.createContrato, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/contratos
 * @desc    Lista todos os contratos (com filtros)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/',
  validate(listContratosSchema), // 1. Valida os query params
  contratoController.getAllContratos, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/contratos/:id
 * @desc    Busca um contrato específico
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/:id',
  validate(getContratoSchema), // 1. Valida o :id
  contratoController.getContratoById, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/contratos/:id
 * @desc    Atualiza um contrato (ex: status)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.put(
  '/:id',
  validate(updateContratoSchema), // 1. Valida o :id e o body (status)
  contratoController.updateContrato, // 2. Chama o controlador
);

/**
 * @route   DELETE /api/v1/contratos/:id
 * @desc    Apaga um contrato
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.delete(
  '/:id',
  validate(getContratoSchema), // 1. Valida o :id
  contratoController.deleteContrato, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/contratos/:id/download
 * @desc    Gera o PDF do contrato
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/:id/download',
  validate(getContratoSchema), // 1. Valida o :id
  contratoController.downloadContrato_PDF, // 2. Chama o controlador
);

export const contratoRoutes = router;