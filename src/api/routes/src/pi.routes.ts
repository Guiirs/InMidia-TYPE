import { Router } from 'express';
import { piController } from '@/api/controllers/src/pi.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import {
  piBodySchema, // (usado para POST)
  updatePiSchema, // (usado para PUT)
  listPisSchema, // (usado para GET /)
} from '@/utils/validators/pi.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator'; // (usado para :id)

/**
 * Define as rotas de gestão de Propostas Internas (PIs) (ex: /api/v1/pis/...).
 * (Migração de routes/piRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de PIs (/pis)...');

// --- Middleware de Autenticação ---
// (Lógica do JS original)
router.use(authMiddleware);

/**
 * @route   GET /api/v1/pis
 * @desc    Lista todas as PIs (com filtros)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/',
  validate(listPisSchema), // 1. Valida query params (Zod)
  piController.getAllPIs, // 2. Chama o controlador
);

/**
 * @route   POST /api/v1/pis
 * @desc    Cria uma nova PI
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.post(
  '/',
  validate(piBodySchema), // 1. Valida o body (Zod)
  piController.createPI, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/pis/:id
 * @desc    Busca uma PI específica
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  piController.getPIById, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/pis/:id
 * @desc    Atualiza uma PI
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.put(
  '/:id',
  validate(updatePiSchema), // 1. Valida o body e params (Zod)
  piController.updatePI, // 2. Chama o controlador
);

/**
 * @route   DELETE /api/v1/pis/:id
 * @desc    Apaga uma PI
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  piController.deletePI, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/pis/:id/download
 * @desc    Gera o PDF da PI
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/:id/download',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  piController.downloadPI_PDF, // 2. Chama o controlador
);

export const piRoutes = router;