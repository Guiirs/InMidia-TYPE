import { Request, Response, NextFunction } from 'express';
// [CORREÇÃO] Importação ajustada para usar o barrel file de serviços.
import {
  publicApiService,
  PublicApiService,
} from '@/api/services';
import { logger } from '@/config/logger';

/**
 * Controlador para lidar com as rotas da API Pública (/public).
 * (Migração de controllers/publicApiController.js)
 */
export class PublicApiController {
  constructor(private readonly service: PublicApiService) {}

  /**
   * Obtém as placas disponíveis para a empresa autenticada via API Key.
   * Rota: GET /api/public/placas/disponiveis
   */
  async getAvailablePlacas(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      // O 'apiKeyAuthMiddleware' garante que req.empresa (com _id) existe
      // [NOTA] O req.empresa é injetado pelo apiKeyAuthMiddleware
      const empresaId = req.empresa._id;
      const empresaNome = req.empresa.nome;

      logger.info(
        `[PublicApiController] API Key validada para ${empresaNome}. Buscando placas.`,
      );

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' (string | ObjectId) para string.
      const placas = await this.service.getAvailablePlacas(
        empresaId.toString(),
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: placas,
      });
    } catch (error) {
      // Passa erros (ex: 500 do serviço)
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const publicApiController = new PublicApiController(publicApiService);