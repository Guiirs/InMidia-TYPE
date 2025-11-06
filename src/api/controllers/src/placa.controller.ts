import { Request, Response, NextFunction } from 'express';
// Importação ajustada para usar o barrel file de serviços.
import { placaService, PlacaService } from '@/api/services';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import {
  // [CORREÇÃO 7.1] Corrigido o nome do DTO de 'CreatePlacaDto' para 'PlacaBodyDto'
  // para corresponder ao que é exportado pelo 'placa.validator.ts'.
  PlacaBodyDto,
  UpdatePlacaDto,
  ListPlacasDto,
  CheckDisponibilidadeDto,
} from '@/utils/validators/placa.validator';

// Tipos para os parâmetros de rota
type MongoIdParam = { id: string };

/**
 * Controlador para lidar com as rotas de Placas (Mídia OOH) (/placas).
 * (Migração de controllers/placaController.js)
 */
export class PlacaController {
  constructor(private readonly service: PlacaService) {}

  /**
   * Cria uma nova placa (com upload de imagem).
   * Rota: POST /api/v1/placas
   */
  async createPlaca(
    // [CORREÇÃO 7.1] Tipo de DTO do body corrigido para 'PlacaBodyDto'.
    req: Request<unknown, unknown, PlacaBodyDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;
      const file = req.file; // Anexado pelo middleware 'upload'

      // Removido 'any' do log. 'originalname' é uma prop padrão de Multer.
      logger.debug(
        `[PlacaController] Ficheiro recebido (create): ${
          file ? file.originalname : 'Nenhum'
        }`,
      );

      // Erro TS(2345): Convertido 'empresaId' para string.
      const novaPlaca = await this.service.createPlaca(
        dto,
        file,
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(201).json({
        status: 'success',
        data: novaPlaca,
      });
    } catch (error) {
      // Passa erros (ex: 404 Região, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Atualiza uma placa existente (com upload de imagem).
   * Rota: PUT /api/v1/placas/:id
   */
  async updatePlaca(
    req: Request<MongoIdParam, unknown, UpdatePlacaDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;
      const file = req.file; // Anexado pelo middleware 'upload'

      // Removido 'any' do log.
      logger.debug(
        `[PlacaController] Ficheiro recebido (update): ${
          file ? file.originalname : 'Nenhum'
        }`,
      );

      // Erro TS(2345): Convertido 'empresaId' para string.
      const placaAtualizada = await this.service.updatePlaca(
        id,
        dto,
        file,
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: placaAtualizada,
      });
    } catch (error) {
      // Passa erros (ex: 404, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Busca todas as placas (com filtros, paginação).
   * Rota: GET /api/v1/placas
   */
  async getAllPlacas(
    req: Request<unknown, unknown, unknown, ListPlacasDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado pelo Zod

      // Erro TS(2345): Convertido 'empresaId' para string.
      const result = await this.service.getAllPlacas(empresaId.toString(), dto);

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma placa específica pelo ID.
   * Rota: GET /api/v1/placas/:id
   */
  async getPlacaById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // Erro TS(2345): Convertido 'empresaId' para string.
      const placa = await this.service.getPlacaById(id, empresaId.toString());

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: placa,
      });
    } catch (error) {
      // Passa erro (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Apaga uma placa.
   * Rota: DELETE /api/v1/placas/:id
   */
  async deletePlaca(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // Erro TS(2345): Convertido 'empresaId' para string.
      await this.service.deletePlaca(id, empresaId.toString());

      // (Resposta 204 é o padrão correto para DELETE sem conteúdo)
      res.status(204).send();
    } catch (error) {
      // Passa erros (ex: 409 Em uso, 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Alterna a disponibilidade (manutenção).
   * Rota: PATCH /api/v1/placas/:id/disponibilidade
   */
  async toggleDisponibilidade(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // Erro TS(2345): Convertido 'empresaId' para string.
      const placaAtualizada = await this.service.toggleDisponibilidade(
        id,
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: placaAtualizada,
      });
    } catch (error) {
      // Passa erros (ex: 409 Em uso, 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Busca todas as localizações de placas (para o mapa).
   * Rota: GET /api/v1/placas/locations
   */
  async getPlacaLocations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      // Erro TS(2345): Convertido 'empresaId' para string.
      const locations = await this.service.getAllPlacaLocations(
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca placas disponíveis por período.
   * Rota: GET /api/v1/placas/disponiveis
   */
  async getPlacasDisponiveis(
    req: Request<unknown, unknown, unknown, CheckDisponibilidadeDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado pelo Zod (datas, regiao, search)

      // Erro TS(2345): Convertido 'empresaId' para string.
      const placas = await this.service.getPlacasDisponiveis(
        empresaId.toString(),
        dto,
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: placas,
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const placaController = new PlacaController(placaService);