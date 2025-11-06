import { Router } from 'express';
import { relatorioController } from '@/api/controllers/src/relatorio.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import { ocupacaoPorPeriodoSchema } from '@/utils/validators/relatorio.validator';

/**
 * Define as rotas de Relatórios (ex: /api/v1/relatorios/...).
 * (Migração de routes/relatoriosRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Relatórios (/relatorios)...');

// --- Middleware de Autenticação ---
// (Lógica do JS original)
router.use(authMiddleware);

/**
 * @route   GET /api/v1/relatorios/placas-por-regiao
 * @desc    Relatório de Placas por Região (Dashboard)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/placas-por-regiao',
  relatorioController.getPlacasPorRegiao, // 1. Chama o controlador
);

/**
 * @route   GET /api/v1/relatorios/dashboard-summary
 * @desc    Resumo do Dashboard (Cards)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/dashboard-summary',
  relatorioController.getDashboardSummary, // 1. Chama o controlador
);

/**
 * @route   GET /api/v1/relatorios/ocupacao-por-periodo
 * @desc    Ocupação por Período (Retorna JSON)
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/ocupacao-por-periodo',
  validate(ocupacaoPorPeriodoSchema), // 1. Valida query params (datas)
  relatorioController.getOcupacaoPorPeriodo, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/relatorios/export/ocupacao-por-periodo
 * @desc    Exportação de Ocupação por Período em PDF
 * @access  Privado (Autenticado)
 * (Migração de)
 */
router.get(
  '/export/ocupacao-por-periodo',
  validate(ocupacaoPorPeriodoSchema), // 1. Valida query params (datas)
  relatorioController.exportOcupacaoPdf, // 2. Chama o controlador
);

export const relatorioRoutes = router;