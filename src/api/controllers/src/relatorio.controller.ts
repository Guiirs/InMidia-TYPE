import { Request, Response, NextFunction } from 'express';
import {
  relatorioService,
  RelatorioService,
} from '@/api/services/src/relatorio.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import { OcupacaoPorPeriodoDto } from '@/utils/validators/relatorio.validator';

/**
 * Controlador para lidar com as rotas de Relatórios (/relatorios).
 * (Migração de controllers/relatorioController.js)
 */
export class RelatorioController {
  constructor(private readonly service: RelatorioService) {}

  /**
   * Obtém placas por região (para o Dashboard).
   * (Migração de controllers/relatorioController.js -> getPlacasPorRegiao)
   * Rota: GET /api/v1/relatorios/placas-por-regiao
   */
  async getPlacasPorRegiao(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId } = req.user!;
      const data = await this.service.placasPorRegiao(empresaId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gera o resumo do dashboard (Cards).
   * (Migração de controllers/relatorioController.js -> getDashboardSummary)
   * Rota: GET /api/v1/relatorios/dashboard-summary
   */
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId } = req.user!;
      const summary = await this.service.getDashboardSummary(empresaId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém a percentagem de ocupação por período (Retorna JSON).
   * (Migração de controllers/relatorioController.js -> getOcupacaoPorPeriodo)
   * Rota: GET /api/v1/relatorios/ocupacao-por-periodo
   */
  async getOcupacaoPorPeriodo(
    req: Request<unknown, unknown, unknown, OcupacaoPorPeriodoDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado pelo Zod (data_inicio, data_fim)

      const reportData = await this.service.ocupacaoPorPeriodo(empresaId, dto);
      res.status(200).json(reportData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gera e exporta o relatório de ocupação como PDF.
   * (Migração de controllers/relatorioController.js -> exportOcupacaoPdf)
   * Rota: GET /api/v1/relatorios/export/ocupacao-por-periodo
   */
  async exportOcupacaoPdf(
    req: Request<unknown, unknown, unknown, OcupacaoPorPeriodoDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.query;

      // 1. Obtém os dados (mesma lógica do endpoint JSON)
      const reportData = await this.service.ocupacaoPorPeriodo(empresaId, dto);

      // 2. Passa os dados e o 'res' para o serviço de PDF
      // O serviço de PDF irá fazer o streaming da resposta
      await this.service.generateOcupacaoPdf(
        reportData,
        dto.data_inicio,
        dto.data_fim,
        res,
      );
    } catch (error) {
      // Se o erro ocorrer antes do streaming, o errorHandler pega
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const relatorioController = new RelatorioController(relatorioService);