import { Router } from 'express';
import { publicApiController } from '@/api/controllers/src/public.controller';
import { logger } from '@/config/logger';

// Middlewares
import { apiKeyAuthMiddleware } from '@/security/middlewares/apiKey.middleware';

/**
 * Define as rotas da API Pública (ex: /api/public/...).
 * (Migração de routes/publicApiRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas da API Pública (/public)...');

// --- Middleware de Autenticação por API Key ---
// (Lógica do JS original)
router.use(apiKeyAuthMiddleware);

/**
 * @route   GET /api/public/placas/disponiveis
 * @desc    Obtém as placas disponíveis para a empresa autenticada via API Key
 * @access  Público (Protegido por API Key)
 * (Migração de)
 */
router.get(
  '/placas/disponiveis',
  publicApiController.getAvailablePlacas, // 1. Chama o controlador
);

export const publicApiRoutes = router;