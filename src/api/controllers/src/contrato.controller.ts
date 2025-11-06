import { Request, Response, NextFunction } from 'express';
import {
  contratoService,
  ContratoService,
} from '@/api/services/src/contrato.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import {
  CreateContratoDto,
  UpdateContratoDto,
  ListContratosDto,
} from '@/utils/validators/contrato.validator';

// Tipos para os parâmetros de rota
type MongoIdParam = { id: string };

/**
 * Controlador para lidar com as rotas de Contratos (/contratos).
 * (Migração de controllers/contratoController.js)
 */
export class ContratoController {
  constructor(private readonly service: ContratoService) {}

  /**
   * Cria um Contrato a partir de uma PI.
   * (Migração de controllers/contratoController.js -> createContrato)
   * Rota: POST /api/v1/contratos
   */
  async createContrato(
    req: Request<unknown, unknown, CreateContratoDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;

      const novoContrato = await this.service.create(dto, empresaId);

      // (Resposta 201)
      res.status(201).json(novoContrato);
    } catch (error) {
      // Passa erros (ex: 404 PI não encontrada, 409 Contrato já existe)
      next(error);
    }
  }

  /**
   * Lista todos os Contratos (com paginação e filtros).
   * (Migração de controllers/contratoController.js -> getAllContratos)
   * Rota: GET /api/v1/contratos
   */
  async getAllContratos(
    req: Request<unknown, unknown, unknown, ListContratosDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado (filtros e paginação)

      const result = await this.service.getAll(empresaId, dto);

      // (Resposta 200)
      res.status(200).json(result); // Retorna { data: [...], pagination: {...} }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um Contrato específico pelo ID.
   * (Migração de controllers/contratoController.js -> getContratoById)
   * Rota: GET /api/v1/contratos/:id
   */
  async getContratoById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // O serviço retorna o documento Mongoose (que o Express serializa com .toJSON())
      const contrato = await this.service.getById(id, empresaId);

      res.status(200).json(contrato);
    } catch (error) {
      // Passa erro (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Atualiza um Contrato (ex: status).
   * (Migração de controllers/contratoController.js -> updateContrato)
   * Rota: PUT /api/v1/contratos/:id
   */
  async updateContrato(
    req: Request<MongoIdParam, unknown, UpdateContratoDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;

      const contratoAtualizado = await this.service.update(id, dto, empresaId);

      // (Resposta 200)
      res.status(200).json(contratoAtualizado);
    } catch (error) {
      // Passa erros (ex: 404, 400 Validação de status)
      next(error);
    }
  }

  /**
   * Deleta um Contrato.
   * (Migração de controllers/contratoController.js -> deleteContrato)
   * Rota: DELETE /api/v1/contratos/:id
   */
  async deleteContrato(
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
      // Passa erros (ex: 404, 400 status não é rascunho)
      next(error);
    }
  }

  /**
   * Gera e faz o download do PDF do Contrato.
   * (Migração de controllers/contratoController.js -> downloadContrato_PDF)
   * Rota: GET /api/v1/contratos/:id/download
   */
  async downloadContrato_PDF(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId, id: userId } = req.user!; // Extrai userId
      const { id: contratoId } = req.params;

      // O serviço de PDF irá fazer o streaming da resposta
      await this.service.generatePDF(contratoId, empresaId, userId, res);
    } catch (error) {
      // Se o erro ocorrer antes do streaming, o errorHandler pega
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const contratoController = new ContratoController(contratoService);