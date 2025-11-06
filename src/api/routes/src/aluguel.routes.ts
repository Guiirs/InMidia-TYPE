import { Router } from 'express';
import { aluguelController } from '@/api/controllers/src/aluguel.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import {
  createAluguelSchema,
  deleteAluguelSchema,
  getAlugueisByPlacaSchema,
} from '@/utils/validators/aluguel.validator';

/**
 * Define as rotas de gestão de Aluguéis (ex: /api/v1/alugueis/...).
 * (Migração de routes/aluguelRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Aluguéis (/alugueis)...');

// --- Middleware de Autenticação ---
// (Lógica do JS original)
router.use(authMiddleware);

/**
 * @route   POST /api/v1/alugueis
 * @desc    Cria um novo aluguel (reserva)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.post(
  '/',
  validate(createAluguelSchema), // 1. Valida o body (Zod)
  aluguelController.createAluguel, // 2. Chama o controlador
);

/**
 * @route   DELETE /api/v1/alugueis/:id
 * @desc    Apaga (cancela) um aluguel
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.delete(
  '/:id',
  validate(deleteAluguelSchema), // 1. Valida o :id (Zod)
  aluguelController.deleteAluguel, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/alugueis/placa/:placaId
 * @desc    Lista o histórico de aluguéis de uma placa
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/placa/:placaId',
  validate(getAlugueisByPlacaSchema), // 1. Valida o :placaId (Zod)
  aluguelController.getAlugueisByPlaca, // 2. Chama o controlador
);

export const aluguelRoutes = router;