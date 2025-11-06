/*
 * Arquivo: src/api/routes/src/relatorio.routes.ts
 * Descrição: Define as rotas de Relatórios (ex: /api/v1/relatorios/...).
 * (Migração de routes/relatoriosRoutes.js)
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Corrigido o erro "No overload matches this call".
 * 2. O erro ocorre porque o middleware `validate(ocupacaoPorPeriodoSchema)`
 * *transforma* `req.query` (convertendo strings ISO para objetos Date).
 * 3. O nosso `relatorioController` está corretamente tipado para *esperar*
 * estes objetos Date (o tipo `OcupacaoPorPeriodoDto`).
 * 4. O `router.get` do Express não sabe que esta transformação ocorreu
 * e vê uma incompatibilidade de tipos.
 * 5. Solução: Usamos `as any` ao passar os métodos do controlador para o
 * router. Isso satisfaz o compilador na definição da rota, mas
 * mantém a forte tipagem *dentro* do controlador, que é o
 * comportamento desejado.
 * 6. [REMOVIDO] `authMiddleware` foi removido (agora é global).
 */

import { Router } from 'express';
import { relatorioController } from '@/api/controllers/src/relatorio.controller';
import { logger } from '@/config/logger';

// Middlewares
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import { ocupacaoPorPeriodoSchema } from '@/utils/validators/relatorio.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Relatórios (/relatorios)...');

// --- Middleware de Autenticação ---
// [REMOVIDO] router.use(authMiddleware);
// (A segurança é aplicada em src/api/routes/index.ts)

/**
 * @route   GET /api/v1/relatorios/placas-por-regiao
 * @desc    Relatório de Placas por Região (Dashboard)
 * @access  Privado (Admin)
 */
router.get(
  '/placas-por-regiao',
  relatorioController.getPlacasPorRegiao, // 1. Chama o controlador
);

/**
 * @route   GET /api/v1/relatorios/dashboard-summary
 * @desc    Resumo do Dashboard (Cards)
 * @access  Privado (Admin)
 */
router.get(
  '/dashboard-summary',
  relatorioController.getDashboardSummary, // 1. Chama o controlador
);

/**
 * @route   GET /api/v1/relatorios/ocupacao-por-periodo
 * @desc    Ocupação por Período (Retorna JSON)
 * @access  Privado (Admin)
 */
router.get(
  '/ocupacao-por-periodo',
  validate(ocupacaoPorPeriodoSchema), // 1. Valida e *transforma* query params
  // [FIX] Cast para 'any' para resolver o conflito de tipo de overload (TS2769)
  // O controlador (getOcupacaoPorPeriodo) ainda está fortemente tipado.
  relatorioController.getOcupacaoPorPeriodo as any, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/relatorios/export/ocupacao-por-periodo
 * @desc    Exportação de Ocupação por Período em PDF
 * @access  Privado (Admin)
 */
router.get(
  '/export/ocupacao-por-periodo',
  validate(ocupacaoPorPeriodoSchema), // 1. Valida e *transforma* query params
  // [FIX] Cast para 'any' para resolver o conflito de tipo de overload (TS2769)
  relatorioController.exportOcupacaoPdf as any, // 2. Chama o controlador
);

export const relatorioRoutes = router;