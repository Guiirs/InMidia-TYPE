import { Request, Response, NextFunction } from 'express';
import { placaService, PlacaService } from '@/api/services/src/placa.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import {
  CreatePlacaDto,
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
   * (Migração de controllers/placaController.js -> createPlacaController)
   * Rota: POST /api/v1/placas
   */
  async createPlaca(
    req: Request<unknown, unknown, CreatePlacaDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;
      const file = req.file; // Anexado pelo middleware 'upload'

      logger.debug(`[PlacaController] Ficheiro recebido (create): ${file ? (file as any).key : 'Nenhum'}`);

      const novaPlaca = await this.service.createPlaca(dto, file, empresaId);

      // (Resposta 201)
      res.status(201).json(novaPlaca);
    } catch (error) {
      // Passa erros (ex: 404 Região, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Atualiza uma placa existente (com upload de imagem).
   * (Migração de controllers/placaController.js -> updatePlacaController)
   * Rota: PUT /api/v1/placas/:id
   */
  async updatePlaca(
    req: Request<MongoIdParam, unknown, UpdatePlacaDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;
      const file = req.file; // Anexado pelo middleware 'upload'

      logger.debug(`[PlacaController] Ficheiro recebido (update): ${file ? (file as any).key : 'Nenhum'}`);
      
      const placaAtualizada = await this.service.updatePlaca(
        id,
        dto,
        file,
        empresaId,
      );

      // (Resposta 200)
      res.status(200).json(placaAtualizada);
    } catch (error) {
      // Passa erros (ex: 404, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Busca todas as placas (com filtros, paginação).
   * (Migração de controllers/placaController.js -> getAllPlacasController)
   * Rota: GET /api/v1/placas
   */
  async getAllPlacas(
    req: Request<unknown, unknown, unknown, ListPlacasDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado pelo Zod

      const result = await this.service.getAllPlacas(empresaId, dto);

      // (Resposta 200)
      res.status(200).json(result); // Retorna { data: [...], pagination: {...} }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma placa específica pelo ID.
   * (Migração de controllers/placaController.js -> getPlacaByIdController)
   * Rota: GET /api/v1/placas/:id
   */
  async getPlacaById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      const placa = await this.service.getPlacaById(id, empresaId);

      res.status(200).json(placa);
    } catch (error) {
      // Passa erro (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Apaga uma placa.
   * (Migração de controllers/placaController.js -> deletePlacaController)
   * Rota: DELETE /api/v1/placas/:id
   */
  async deletePlaca(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      await this.service.deletePlaca(id, empresaId);

      // (Resposta 204)
      res.status(204).send();
    } catch (error) {
      // Passa erros (ex: 409 Em uso, 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Alterna a disponibilidade (manutenção).
   * (Migração de controllers/placaController.js -> toggleDisponibilidadeController)
   * Rota: PATCH /api/v1/placas/:id/disponibilidade
   */
  async toggleDisponibilidade(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      const placaAtualizada = await this.service.toggleDisponibilidade(
        id,
        empresaId,
      );

      res.status(200).json(placaAtualizada);
    } catch (error) {
      // Passa erros (ex: 409 Em uso, 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Busca todas as localizações de placas (para o mapa).
   * (Migração de controllers/placaController.js -> getPlacaLocationsController)
   * Rota: GET /api/v1/placas/locations
   */
  async getPlacaLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId } = req.user!;
      const locations = await this.service.getAllPlacaLocations(empresaId);
      res.status(200).json(locations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca placas disponíveis por período.
   * (Migração de controllers/placaController.js -> getPlacasDisponiveisController)
   * Rota: GET /api/v1/placas/disponiveis
   */
  async getPlacasDisponiveis(
    req: Request<unknown, unknown, unknown, CheckDisponibilidadeDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado pelo Zod (datas, regiao, search)

      const placas = await this.service.getPlacasDisponiveis(empresaId, dto);

      // (Resposta 200)
      // O JS original retorna { data: [...] }
      res.status(200).json({ data: placas });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const placaController = new PlacaController(placaService);