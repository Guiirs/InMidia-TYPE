/*
 * Arquivo: src/api/routes/src/contrato.routes.ts
 * Descrição: Define as rotas de gestão de Contratos.
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Adicionada a asserção `as any` a todos os métodos do
 * controlador que são chamados *após* o middleware `validate`.
 * 2. [REMOVIDO] `authMiddleware` foi removido (agora é global).
 */

import { Router } from 'express';
import { contratoController } from '@/api/controllers/src/contrato.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import {
  createContratoSchema,
  updateContratoSchema,
  listContratosSchema,
  getContratoSchema, // (Validador para :id)
} from '@/utils/validators/contrato.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Contratos (/contratos)...');

// Segurança (Auth/Admin) é aplicada em src/api/routes/index.ts

/**
 * @route   POST /api/v1/contratos
 * @desc    Cria um contrato a partir de uma PI
 * @access  Privado (Admin)
 */
router.post(
  '/',
  validate(createContratoSchema), // 1. Valida o piId no body
  contratoController.createContrato as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/contratos
 * @desc    Lista todos os contratos (com filtros)
 * @access  Privado (Admin)
 */
router.get(
  '/',
  validate(listContratosSchema), // 1. Valida os query params
  contratoController.getAllContratos as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/contratos/:id
 * @desc    Busca um contrato específico
 * @access  Privado (Admin)
 */
router.get(
  '/:id',
  validate(getContratoSchema), // 1. Valida o :id
  contratoController.getContratoById as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   PUT /api/v1/contratos/:id
 * @desc    Atualiza um contrato (ex: status)
 * @access  Privado (Admin)
 */
router.put(
  '/:id',
  validate(updateContratoSchema), // 1. Valida o :id e o body (status)
  contratoController.updateContrato as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   DELETE /api/v1/contratos/:id
 * @desc    Apaga um contrato
 * @access  Privado (Admin)
 */
router.delete(
  '/:id',
  validate(getContratoSchema), // 1. Valida o :id
  contratoController.deleteContrato as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/contratos/:id/download
 * @desc    Gera o PDF do contrato
 * @access  Privado (Admin)
 */
router.get(
  '/:id/download',
  validate(getContratoSchema), // 1. Valida o :id
  contratoController.downloadContrato_PDF as any, // 2. [FIX] Chama o controlador
);

export const contratoRoutes = router;