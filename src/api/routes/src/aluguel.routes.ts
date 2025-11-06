/*
 * Arquivo: src/api/routes/src/aluguel.routes.ts
 * Descrição: Define as rotas de gestão de Aluguéis.
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Adicionada a asserção `as any` a todos os métodos do
 * controlador que são chamados *após* o middleware `validate`.
 * 2. [REMOVIDO] `authMiddleware` foi removido (agora é global).
 */

import { Router } from 'express';
import { aluguelController } from '@/api/controllers/src/aluguel.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import {
  createAluguelSchema,
  deleteAluguelSchema,
  getAlugueisByPlacaSchema,
} from '@/utils/validators/aluguel.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Aluguéis (/alugueis)...');

// Segurança (Auth/Admin) é aplicada em src/api/routes/index.ts

/**
 * @route   POST /api/v1/alugueis
 * @desc    Cria um novo aluguel (reserva)
 * @access  Privado (Admin)
 */
router.post(
  '/',
  validate(createAluguelSchema), // 1. Valida o body (Zod)
  aluguelController.createAluguel as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   DELETE /api/v1/alugueis/:id
 * @desc    Apaga (cancela) um aluguel
 * @access  Privado (Admin)
 */
router.delete(
  '/:id',
  validate(deleteAluguelSchema), // 1. Valida o :id (Zod)
  aluguelController.deleteAluguel as any, // 2. [FIX] Chama o controlador
);

/**
 * @route   GET /api/v1/alugueis/placa/:placaId
 * @desc    Lista o histórico de aluguéis de uma placa
 * @access  Privado (Admin)
 */
router.get(
  '/placa/:placaId',
  validate(getAlugueisByPlacaSchema), // 1. Valida o :placaId (Zod)
  aluguelController.getAlugueisByPlaca as any, // 2. [FIX] Chama o controlador
);

export const aluguelRoutes = router;