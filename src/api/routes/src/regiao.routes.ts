/*
 * Arquivo: src/api/routes/src/regiao.routes.ts
 * Descrição: Define as rotas de gestão de Regiões (ex: /api/v1/regioes/...).
 * (Migração de routes/regiaoRoutes.js)
 *
 * Alterações (Melhoria de Robustez):
 * 1. [REMOVIDO] Removida a importação de `authMiddleware`.
 * 2. [REMOVIDO] Removida a importação de `adminMiddleware`.
 * 3. [REMOVIDO] Removido o `router.use(authMiddleware)` e `router.use(adminMiddleware)`.
 *
 * Motivo: Estes middlewares agora são aplicados globalmente a este
 * grupo de rotas no ficheiro `src/api/routes/index.ts`, centralizando
 * a segurança e limpando os ficheiros de rotas individuais.
 */

import { Router } from 'express';
import { regiaoController } from '@/api/controllers/src/regiao.controller';
import { logger } from '@/config/logger';

// Middlewares
// [REMOVIDO] import { authMiddleware } from '@/security/middlewares/auth.middleware';
// [REMOVIDO] import { adminMiddleware } from '@/security/middlewares/admin.middleware';
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import {
  createRegiaoSchema,
  updateRegiaoSchema,
} from '@/utils/validators/regiao.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Regiões (/regioes)...');

// --- Middlewares Aplicados a Todas as Rotas /regioes ---
// [REMOVIDO] router.use(authMiddleware);
// [REMOVIDO] router.use(adminMiddleware);
// (A segurança é aplicada em src/api/routes/index.ts)

/**
 * @route   GET /api/v1/regioes
 * @desc    Lista todas as regiões
 * @access  Privado (Admin)
 */
router.get(
  '/',
  regiaoController.getAllRegioes, // 1. Chama o controlador
);

/**
 * @route   POST /api/v1/regioes
 * @desc    Cria uma nova região
 * @access  Privado (Admin)
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
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  regiaoController.deleteRegiao, // 2. Chama o controlador
);

export const regiaoRoutes = router;