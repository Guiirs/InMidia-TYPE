import { Router } from 'express';
import { regiaoController } from '@/api/controllers/src/regiao.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { adminMiddleware } from '@/security/middlewares/admin.middleware'; // (Regiões são gestão de Admin)
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import {
  createRegiaoSchema,
  updateRegiaoSchema,
} from '@/utils/validators/regiao.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator';

/**
 * Define as rotas de gestão de Regiões (ex: /api/v1/regioes/...).
 * (Migração de routes/regiaoRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Regiões (/regioes)...');

// --- Middlewares Aplicados a Todas as Rotas /regioes ---
// (Lógica do JS original)
router.use(authMiddleware);
// (Nota: A gestão de regiões é tipicamente uma tarefa de Admin,
// vamos adicionar o adminMiddleware para maior segurança)
router.use(adminMiddleware);

/**
 * @route   GET /api/v1/regioes
 * @desc    Lista todas as regiões
 * @access  Privado (Admin)
 * (Migração de)
 */
router.get(
  '/',
  regiaoController.getAllRegioes, // 1. Chama o controlador
);

/**
 * @route   POST /api/v1/regioes
 * @desc    Cria uma nova região
 * @access  Privado (Admin)
 * (Migração de)
 */
router.post(
  '/',
  validate(createRegiaoSchema), // 1. Valida o body (Zod)
  regiaoController.createRegiao, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/regioes/:id
 * @desc    Atualiza o nome de uma região
 * @access  Privado (Admin)
 * (Migração de)
 */
router.put(
  '/:id',
  validate(updateRegiaoSchema), // 1. Valida o body e params (Zod)
  regiaoController.updateRegiao, // 2. Chama o controlador
);

/**
 * @route   DELETE /api/v1/regioes/:id
 * @desc    Apaga uma região
 * @access  Privado (Admin)
 * (Migração de)
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  regiaoController.deleteRegiao, // 2. Chama o controlador
);

export const regiaoRoutes = router;