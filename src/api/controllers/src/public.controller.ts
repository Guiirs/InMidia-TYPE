import { Request, Response, NextFunction } from 'express';
import {
  publicApiService,
  PublicApiService,
} from '@/api/services/src/public.service';
import { logger } from '@/config/logger';

/**
 * Controlador para lidar com as rotas da API Pública (/public).
 * (Migração de controllers/publicApiController.js)
 */
export class PublicApiController {
  constructor(private readonly service: PublicApiService) {}

  /**
   * Obtém as placas disponíveis para a empresa autenticada via API Key.
   * (Migração de controllers/publicApiController.js -> getAvailablePlacas)
   * Rota: GET /api/public/placas/disponiveis
   */
  async getAvailablePlacas(req: Request, res: Response, next: NextFunction) {
    try {
      // O 'apiKeyAuthMiddleware' garante que req.empresa (com _id) existe
      const empresaId = req.empresa._id;
      const empresaNome = req.empresa.nome;

      logger.info(
        `[PublicApiController] API Key validada para ${empresaNome}. Buscando placas.`,
      );

      const placas = await this.service.getAvailablePlacas(empresaId);

      // (Resposta 200)
      res.status(200).json(placas);
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