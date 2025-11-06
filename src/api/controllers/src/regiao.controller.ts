import { Request, Response, NextFunction } from 'express';
import { regiaoService, RegiaoService } from '@/api/services/src/regiao.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import {
  CreateRegiaoDto,
  UpdateRegiaoDto,
} from '@/utils/validators/regiao.validator';

// Tipos para os parâmetros de rota
type MongoIdParam = { id: string };

/**
 * Controlador para lidar com as rotas de Regiões (/regioes).
 * (Migração de controllers/regiaoController.js)
 */
export class RegiaoController {
  constructor(private readonly service: RegiaoService) {}

  /**
   * Obtém todas as regiões da empresa.
   * (Migração de controllers/regiaoController.js -> getAllRegioes)
   * Rota: GET /api/v1/regioes
   */
  async getAllRegioes(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId } = req.user!;
      const regioes = await this.service.getAll(empresaId);
      res.status(200).json(regioes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova região.
   * (Migração de controllers/regiaoController.js -> createRegiao)
   * Rota: POST /api/v1/regioes
   */
  async createRegiao(
    req: Request<unknown, unknown, CreateRegiaoDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;

      const novaRegiao = await this.service.create(dto, empresaId);

      // (Resposta 201)
      res.status(201).json(novaRegiao);
    } catch (error) {
      // Passa erros (ex: 409 Duplicado) para o errorHandler
      next(error);
    }
  }

  /**
   * Atualiza o nome de uma região.
   * (Migração de controllers/regiaoController.js -> updateRegiao)
   * Rota: PUT /api/v1/regioes/:id
   */
  async updateRegiao(
    req: Request<MongoIdParam, unknown, UpdateRegiaoDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;

      const regiaoAtualizada = await this.service.update(id, dto, empresaId);

      // (Resposta 200)
      res.status(200).json(regiaoAtualizada);
    } catch (error) {
      // Passa erros (ex: 404, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Apaga uma região.
   * (Migração de controllers/regiaoController.js -> deleteRegiao)
   * Rota: DELETE /api/v1/regioes/:id
   */
  async deleteRegiao(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      await this.service.delete(id, empresaId);

      // (Resposta 204)
      res.status(204).send();
    } catch (error) {
      // Passa erros (ex: 400 Região em uso, 404 Não Encontrado)
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const regiaoController = new RegiaoController(regiaoService);