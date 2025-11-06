import { Request, Response, NextFunction } from 'express';
import {
  clienteService,
  ClienteService,
} from '@/api/services/src/cliente.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import {
  CreateClienteDto,
  UpdateClienteDto,
  ListClientesDto,
} from '@/utils/validators/cliente.validator';

// Tipos para os parâmetros de rota
type MongoIdParam = { id: string };

/**
 * Controlador para lidar com as rotas de Clientes (/clientes).
 * (Migração de controllers/clienteController.js)
 */
export class ClienteController {
  constructor(private readonly service: ClienteService) {}

  /**
   * Cria um novo cliente (com upload de logo).
   * (Migração de controllers/clienteController.js -> createClienteController)
   * Rota: POST /api/v1/clientes
   */
  async createCliente(
    req: Request<unknown, unknown, CreateClienteDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;
      const file = req.file; // Anexado pelo middleware 'upload'

      logger.debug(`[ClienteController] Ficheiro (logo) recebido (create): ${file ? (file as any).key : 'Nenhum'}`);

      const novoCliente = await this.service.createCliente(
        dto,
        file,
        empresaId,
      );

      // (Resposta 201)
      res.status(201).json(novoCliente);
    } catch (error) {
      // Passa erros (ex: 409 Duplicado CNPJ/Email)
      next(error);
    }
  }

  /**
   * Atualiza um cliente existente (com upload de logo).
   * (Migração de controllers/clienteController.js -> updateClienteController)
   * Rota: PUT /api/v1/clientes/:id
   */
  async updateCliente(
    req: Request<MongoIdParam, unknown, UpdateClienteDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;
      const file = req.file; // Anexado pelo middleware 'upload'

      logger.debug(`[ClienteController] Ficheiro (logo) recebido (update): ${file ? (file as any).key : 'Nenhum'}`);
      
      const clienteAtualizado = await this.service.updateCliente(
        id,
        dto,
        file,
        empresaId,
      );

      // (Resposta 200)
      res.status(200).json(clienteAtualizado);
    } catch (error) {
      // Passa erros (ex: 404, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Busca todos os clientes da empresa (com paginação).
   * (Migração de controllers/clienteController.js -> getAllClientesController)
   * Rota: GET /api/v1/clientes
   */
  async getAllClientes(
    req: Request<unknown, unknown, unknown, ListClientesDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado (page, limit)

      const result = await this.service.getAllClientes(empresaId, dto);

      // (Resposta 200)
      res.status(200).json(result); // Retorna { data: [...], pagination: {...} }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um cliente específico pelo ID.
   * (Migração de controllers/clienteController.js -> getClienteByIdController)
   * Rota: GET /api/v1/clientes/:id
   */
  async getClienteById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      const cliente = await this.service.getClienteById(id, empresaId);

      res.status(200).json(cliente);
    } catch (error) {
      // Passa erro (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Apaga um cliente.
   * (Migração de controllers/clienteController.js -> deleteClienteController)
   * Rota: DELETE /api/v1/clientes/:id
   */
  async deleteCliente(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      await this.service.deleteCliente(id, empresaId);

      // (Resposta 204)
      res.status(204).send();
    } catch (error) {
      // Passa erros (ex: 409 Em uso, 404 Não Encontrado)
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const clienteController = new ClienteController(clienteService);