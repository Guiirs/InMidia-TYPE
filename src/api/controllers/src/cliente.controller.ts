import { Request, Response, NextFunction } from 'express';
// Importação ajustada para usar o barrel file de serviços.
import {
  clienteService,
  ClienteService,
} from '@/api/services';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import {
  // [CORREÇÃO 8.1] Corrigido o nome do DTO de 'CreateClienteDto' para 'ClienteBodyDto'
  // para corresponder ao que é exportado pelo 'cliente.validator.ts'.
  ClienteBodyDto,
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
   * Rota: POST /api/v1/clientes
   */
  async createCliente(
    // [CORREÇÃO 8.1] Tipo de DTO do body corrigido para 'ClienteBodyDto'.
    req: Request<unknown, unknown, ClienteBodyDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;
      const file = req.file; // Anexado pelo middleware 'upload'

      // Removido 'any' do log.
      logger.debug(
        `[ClienteController] Ficheiro (logo) recebido (create): ${
          file ? file.originalname : 'Nenhum'
        }`,
      );

      // Erro TS(2345): Convertido 'empresaId' para string.
      const novoCliente = await this.service.createCliente(
        dto,
        file,
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(201).json({
        status: 'success',
        data: novoCliente,
      });
    } catch (error) {
      // Passa erros (ex: 409 Duplicado CNPJ/Email)
      next(error);
    }
  }

  /**
   * Atualiza um cliente existente (com upload de logo).
   * Rota: PUT /api/v1/clientes/:id
   */
  async updateCliente(
    req: Request<MongoIdParam, unknown, UpdateClienteDto>,
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
        `[ClienteController] Ficheiro (logo) recebido (update): ${
          file ? file.originalname : 'Nenhum'
        }`,
      );

      // Erro TS(2345): Convertido 'empresaId' para string.
      const clienteAtualizado = await this.service.updateCliente(
        id,
        dto,
        file,
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: clienteAtualizado,
      });
    } catch (error) {
      // Passa erros (ex: 404, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Busca todos os clientes da empresa (com paginação).
   * Rota: GET /api/v1/clientes
   */
  async getAllClientes(
    req: Request<unknown, unknown, unknown, ListClientesDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado (page, limit)

      // Erro TS(2345): Convertido 'empresaId' para string.
      const result = await this.service.getAllClientes(
        empresaId.toString(),
        dto,
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: result, // Retorna { data: [...], pagination: {...} }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um cliente específico pelo ID.
   * Rota: GET /api/v1/clientes/:id
   */
  async getClienteById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // Erro TS(2345): Convertido 'empresaId' para string.
      const cliente = await this.service.getClienteById(
        id,
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: cliente,
      });
    } catch (error) {
      // Passa erro (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Apaga um cliente.
   * Rota: DELETE /api/v1/clientes/:id
   */
  async deleteCliente(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // Erro TS(2345): Convertido 'empresaId' para string.
      await this.service.deleteCliente(id, empresaId.toString());

      // (Resposta 204 é o padrão correto para DELETE sem conteúdo)
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