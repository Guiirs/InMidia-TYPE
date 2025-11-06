/*
 * Arquivo: src/api/routes/src/placa.routes.ts
 * Descrição: Define as rotas de gestão de Placas.
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Adicionada a asserção `as any` a todos os métodos do
 * controlador que são chamados *após* o middleware `validate`.
 * 2. [REMOVIDO] `authMiddleware` e `adminMiddleware` foram removidos
 * (agora são globais).
 */

import { Router } from 'express';
import { placaController } from '@/api/controllers/src/placa.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';
import { upload } from '@/security/middlewares/src/upload.middleware'; // Importa o Multer

// Validadores Zod (DTOs)
import {
  placaBodySchema,
  updatePlacaSchema,
  listPlacasSchema,
  checkDisponibilidadeSchema,
} from '@/utils/validators/placa.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Placas (/placas)...');

// Segurança (Auth/Admin) é aplicada em src/api/routes/index.ts

/**
 * @route   GET /api/v1/placas/locations
 * @desc    Busca todas as localizações (coordenadas)
 * @access  Privado (Admin)
 */
router.get(
  '/locations',
  // (Sem 'validate', não precisa de 'as any')
  placaController.getPlacaLocations,
);

/**
 * @route   GET /api/v1/placas/disponiveis
 * @desc    Busca placas disponíveis por período (e filtros)
 * @access  Privado (Admin)
 */
router.get(
  '/disponiveis',
  validate(checkDisponibilidadeSchema), // 1. Valida query params (Zod)
  placaController.getPlacasDisponiveis as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/placas
 * @desc    Busca todas as placas (com filtros e paginação)
 * @access  Privado (Admin)
 */
router.get(
  '/',
  validate(listPlacasSchema), // 1. Valida query params (Zod)
  placaController.getAllPlacas as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   POST /api/v1/placas
 * @desc    Cria uma nova placa (com upload)
 * @access  Privado (Admin)
 */
router.post(
  '/',
  upload.single('imagem'), // 1. Middleware Multer
  validate(placaBodySchema), // 2. Valida o body (Zod)
  placaController.createPlaca as any, // 3. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/placas/:id
 * @desc    Busca uma placa por ID
 * @access  Privado (Admin)
 */
router.get(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  placaController.getPlacaById as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   PUT /api/v1/placas/:id
 * @desc    Atualiza uma placa existente (com upload)
 * @access  Privado (Admin)
 */
router.put(
  '/:id',
  upload.single('imagem'), // 1. Middleware Multer
  validate(updatePlacaSchema), // 2. Valida o body e params (Zod)
  placaController.updatePlaca as any, // 3. [FIX] Chama o controlador
);

/**
 * @route   DELETE /api/v1/placas/:id
 * @desc    Apaga uma placa
 * @access  Privado (Admin)
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  placaController.deletePlaca as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   PATCH /api/v1/placas/:id/disponibilidade
 * @desc    Alterna status de disponibilidade (manutenção)
 * @access  Privado (Admin)
 */
router.patch(
  '/:id/disponibilidade',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  placaController.toggleDisponibilidade as any, // 2. [FIX] Chama o controlador
);

export const placaRoutes = router;