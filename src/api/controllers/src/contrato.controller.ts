import { Request, Response, NextFunction } from 'express';
// [CORREÇÃO] Importação ajustada para usar o barrel file de serviços.
import {
  contratoService,
  ContratoService,
} from '@/api/services';
// [NOTA] 'logger' importado mas não utilizado; pode ser removido.
//import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
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
   * Rota: POST /api/v1/contratos
   */
  async createContrato(
    req: Request<unknown, unknown, CreateContratoDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const novoContrato = await this.service.create(dto, empresaId.toString());

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(201).json({
        status: 'success',
        data: novoContrato,
      });
    } catch (error) {
      // Passa erros (ex: 404 PI não encontrada, 409 Contrato já existe)
      next(error);
    }
  }

  /**
   * Lista todos os Contratos (com paginação e filtros).
   * Rota: GET /api/v1/contratos
   */
  async getAllContratos(
    req: Request<unknown, unknown, unknown, ListContratosDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado (filtros e paginação)

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const result = await this.service.getAll(empresaId.toString(), dto);

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: result, // Retorna { data: [...], pagination: {...} }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um Contrato específico pelo ID.
   * Rota: GET /api/v1/contratos/:id
   */
  async getContratoById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const contrato = await this.service.getById(id, empresaId.toString());

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: contrato,
      });
    } catch (error) {
      // Passa erro (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Atualiza um Contrato (ex: status).
   * Rota: PUT /api/v1/contratos/:id
   */
  async updateContrato(
    req: Request<MongoIdParam, unknown, UpdateContratoDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const contratoAtualizado = await this.service.update(
        id,
        dto,
        empresaId.toString(),
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: contratoAtualizado,
      });
    } catch (error) {
      // Passa erros (ex: 404, 400 Validação de status)
      next(error);
    }
  }

  /**
   * Deleta um Contrato.
   * Rota: DELETE /api/v1/contratos/:id
   */
  async deleteContrato(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      await this.service.delete(id, empresaId.toString());

      // (Resposta 204 é o padrão correto para DELETE sem conteúdo)
      res.status(204).send();
    } catch (error) {
      // Passa erros (ex: 404, 400 status não é rascunho)
      next(error);
    }
  }

  /**
   * Gera e faz o download do PDF do Contrato.
   * Rota: GET /api/v1/contratos/:id/download
   */
  async downloadContrato_PDF(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> { // [CORREÇÃO] O tipo de retorno é Promise<void>
    try {
      const { empresaId, id: userId } = req.user!; // Extrai userId
      const { id: contratoId } = req.params;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' e 'userId' para string.
      // O serviço de PDF irá fazer o streaming da resposta
      await this.service.generatePDF(
        contratoId,
        empresaId.toString(),
        userId.toString(),
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
export const contratoController = new ContratoController(contratoService);