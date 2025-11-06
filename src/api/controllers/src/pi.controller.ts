import { Request, Response, NextFunction } from 'express';
import { piService, PiService } from '@/api/services/src/pi.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import {
  CreatePiDto,
  UpdatePiDto,
  ListPisDto,
} from '@/utils/validators/pi.validator';

// Tipos para os parâmetros de rota
type MongoIdParam = { id: string };

/**
 * Controlador para lidar com as rotas de Propostas Internas (PIs) (/pis).
 * (Migração de controllers/piController.js)
 */
export class PiController {
  constructor(private readonly service: PiService) {}

  /**
   * Cria uma nova PI.
   * (Migração de controllers/piController.js -> createPI)
   * Rota: POST /api/v1/pis
   */
  async createPI(
    req: Request<unknown, unknown, CreatePiDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.body; // DTO validado

      // (A lógica de { ...req.body, cliente: req.body.clienteId }
      // é tratada pelo serviço TS)
      const novaPI = await this.service.create(dto, empresaId);

      // (Resposta 201)
      res.status(201).json(novaPI);
    } catch (error) {
      // Passa erros (ex: 404 Cliente não encontrado)
      next(error);
    }
  }

  /**
   * Lista todas as PIs (com filtros e paginação).
   * (Migração de controllers/piController.js -> getAllPIs)
   * Rota: GET /api/v1/pis
   */
  async getAllPIs(
    req: Request<unknown, unknown, unknown, ListPisDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado

      const result = await this.service.getAll(empresaId, dto);
      res.status(200).json(result); // Retorna { data: [...], pagination: {...} }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma PI específica pelo ID.
   * (Migração de controllers/piController.js -> getPIById)
   * Rota: GET /api/v1/pis/:id
   */
  async getPIById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      const pi = await this.service.getById(id, empresaId);
      res.status(200).json(pi);
    } catch (error) {
      // Passa erro (ex: 404 PI Não Encontrada)
      next(error);
    }
  }

  /**
   * Atualiza uma PI.
   * (Migração de controllers/piController.js -> updatePI)
   * Rota: PUT /api/v1/pis/:id
   */
  async updatePI(
    req: Request<MongoIdParam, unknown, UpdatePiDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;

      const piAtualizada = await this.service.update(id, dto, empresaId);
      res.status(200).json(piAtualizada);
    } catch (error) {
      // Passa erros (ex: 404)
      next(error);
    }
  }

  /**
   * Deleta uma PI.
   * (Migração de controllers/piController.js -> deletePI)
   * Rota: DELETE /api/v1/pis/:id
   */
  async deletePI(
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
      // Passa erros (ex: 404)
      next(error);
    }
  }

  /**
   * Gera e faz o download do PDF da PI.
   * (Migração de controllers/piController.js -> downloadPI_PDF)
   * Rota: GET /api/v1/pis/:id/download
   */
  async downloadPI_PDF(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId, id: userId } = req.user!;
      const { id: piId } = req.params;

      // O serviço de PDF irá fazer o streaming da resposta
      await this.service.generatePDF(piId, empresaId, userId, res);
    } catch (error) {
      // Se o erro ocorrer antes do streaming, o errorHandler pega
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const piController = new PiController(piService);