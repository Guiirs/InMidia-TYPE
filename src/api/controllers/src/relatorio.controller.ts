import { Request, Response, NextFunction } from 'express';
// [CORREÇÃO] Importação ajustada para usar o barrel file de serviços.
import {
  relatorioService,
  RelatorioService,
} from '@/api/services';
// [NOTA] 'logger' importado mas não utilizado; pode ser removido.
//import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import { OcupacaoPorPeriodoDto } from '@/utils/validators/relatorio.validator';

/**
 * Controlador para lidar com as rotas de Relatórios (/relatorios).
 * (Migração de controllers/relatorioController.js)
 */
export class RelatorioController {
  constructor(private readonly service: RelatorioService) {}

  /**
   * Obtém placas por região (para o Dashboard).
   * Rota: GET /api/v1/relatorios/placas-por-regiao
   */
  async getPlacasPorRegiao(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const data = await this.service.placasPorRegiao(empresaId.toString());

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gera o resumo do dashboard (Cards).
   * Rota: GET /api/v1/relatorios/dashboard-summary
   */
  async getDashboardSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const summary = await this.service.getDashboardSummary(
        empresaId.toString(),
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém a percentagem de ocupação por período (Retorna JSON).
   * Rota: GET /api/v1/relatorios/ocupacao-por-periodo
   */
  async getOcupacaoPorPeriodo(
    req: Request<unknown, unknown, unknown, OcupacaoPorPeriodoDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado pelo Zod (data_inicio, data_fim)

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const reportData = await this.service.ocupacaoPorPeriodo(
        empresaId.toString(),
        dto,
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: reportData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gera e exporta o relatório de ocupação como PDF.
   * Rota: GET /api/v1/relatorios/export/ocupacao-por-periodo
   */
  async exportOcupacaoPdf(
    req: Request<unknown, unknown, unknown, OcupacaoPorPeriodoDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> { // [CORREÇÃO] O tipo de retorno é Promise<void>
    try {
      const { empresaId } = req.user!;
      const dto = req.query;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      // 1. Obtém os dados (mesma lógica do endpoint JSON)
      const reportData = await this.service.ocupacaoPorPeriodo(
        empresaId.toString(),
        dto,
      );

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