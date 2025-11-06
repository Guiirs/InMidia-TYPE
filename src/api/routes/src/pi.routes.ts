/*
 * Arquivo: src/api/routes/src/pi.routes.ts
 * Descrição: Define as rotas de gestão de Propostas Internas (PIs).
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Adicionada a asserção `as any` a todos os métodos do
 * controlador que são chamados *após* o middleware `validate`.
 * 2. [REMOVIDO] `authMiddleware` foi removido (agora é global).
 */

import { Router } from 'express';
import { piController } from '@/api/controllers/src/pi.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import {
  piBodySchema, // (usado para POST)
  updatePiSchema, // (usado para PUT)
  listPisSchema, // (usado para GET /)
} from '@/utils/validators/pi.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator'; // (usado para :id)

const router = Router();

logger.info('[Routes] Definindo rotas de PIs (/pis)...');

// Segurança (Auth/Admin) é aplicada em src/api/routes/index.ts

/**
 * @route   GET /api/v1/pis
 * @desc    Lista todas as PIs (com filtros)
 * @access  Privado (Admin)
 */
router.get(
  '/',
  validate(listPisSchema), // 1. Valida query params (Zod)
  piController.getAllPIs as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   POST /api/v1/pis
 * @desc    Cria uma nova PI
 * @access  Privado (Admin)
 */
router.post(
  '/',
  validate(piBodySchema), // 1. Valida o body (Zod)
  piController.createPI as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/pis/:id
 * @desc    Busca uma PI específica
 * @access  Privado (Admin)
 */
router.get(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  piController.getPIById as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   PUT /api/v1/pis/:id
 * @desc    Atualiza uma PI
 * @access  Privado (Admin)
 */
router.put(
  '/:id',
  validate(updatePiSchema), // 1. Valida o body e params (Zod)
  piController.updatePI as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   DELETE /api/v1/pis/:id
 * @desc    Apaga uma PI
 * @access  Privado (Admin)
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  piController.deletePI as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/pis/:id/download
 * @desc    Gera o PDF da PI
 * @access  Privado (Admin)
 */
router.get(
  '/:id/download',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  piController.downloadPI_PDF as any, // 2. [FIX] Chama o controlador
);

export const piRoutes = router;