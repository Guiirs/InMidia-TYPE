/*
 * Arquivo: src/api/routes/src/public.routes.ts
 * Descrição: Define as rotas da API Pública (ex: /api/public/...).
 * (Migração de routes/publicApiRoutes.js)
 *
 * Alterações (Melhoria de Robustez):
 * 1. [Confirmação] Este ficheiro está CORRETO e não necessita de alterações.
 * 2. [Segurança] Ele *não* usa o `authMiddleware` (JWT), o que é
 * intencional, pois estas rotas são para consumo externo via API Key.
 * 3. [Segurança] Ele *corretamente* aplica o `apiKeyAuthMiddleware`
 * para proteger todas as rotas definidas neste router.
 */

import { Router } from 'express';
import { publicApiController } from '@/api/controllers/src/public.controller';
import { logger } from '@/config/logger';

// Middlewares
import { apiKeyAuthMiddleware } from '@/security/middlewares/src/apiKey.middleware';

/**
 * Define as rotas da API Pública (ex: /api/public/...).
 */

const router = Router();

logger.info('[Routes] Definindo rotas da API Pública (/public)...');

// --- Middleware de Autenticação por API Key ---
// (Lógica do JS original - CORRETA)
router.use(apiKeyAuthMiddleware);

/**
 * @route   GET /api/public/placas/disponiveis
 * @desc    Obtém as placas disponíveis para a empresa autenticada via API Key
 * @access  Público (Protegido por API Key)
 */
router.get(
  '/placas/disponiveis',
  publicApiController.getAvailablePlacas, // 1. Chama o controlador
);

export const publicApiRoutes = router;