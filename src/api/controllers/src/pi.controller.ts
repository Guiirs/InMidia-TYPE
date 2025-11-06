import { Request, Response, NextFunction } from 'express';
// Importação ajustada para usar o barrel file de serviços.
import { piService, PiService } from '@/api/services';
// 'logger' removido pois não estava sendo utilizado.

// Tipos DTO dos nossos validadores Zod
import {
  // [CORREÇÃO 10.1] Corrigido o nome do DTO de 'CreatePiDto' para 'PiBodyDto'
  // para corresponder ao que é exportado pelo 'pi.validator.ts' (Erro TS2305).
  PiBodyDto,
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
   * Rota: POST /api/v1/pis
   */
  async createPI(
    // [CORREÇÃO 10.1] Tipo de DTO do body corrigido para 'PiBodyDto'.
    req: Request<unknown, unknown, PiBodyDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.body; // DTO validado

      // Erro TS(2345): Convertido 'empresaId' para string.
      const novaPI = await this.service.create(dto, empresaId.toString());

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(201).json({
        status: 'success',
        data: novaPI,
      });
    } catch (error) {
      // Passa erros (ex: 404 Cliente não encontrado)
      next(error);
    }
  }

  /**
   * Lista todas as PIs (com filtros e paginação).
   * Rota: GET /api/v1/pis
   */
  async getAllPIs(
    req: Request<unknown, unknown, unknown, ListPisDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.query; // DTO validado

      // Erro TS(2345): Convertido 'empresaId' para string.
      const result = await this.service.getAll(empresaId.toString(), dto);

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
   * Busca uma PI específica pelo ID.
   * Rota: GET /api/v1/pis/:id
   */
  async getPIById(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // Erro TS(2345): Convertido 'empresaId' para string.
      const pi = await this.service.getById(id, empresaId.toString());

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: pi,
      });
    } catch (error) {
      // Passa erro (ex: 404 PI Não Encontrada)
      next(error);
    }
  }

  /**
   * Atualiza uma PI.
   * Rota: PUT /api/v1/pis/:id
   */
  async updatePI(
    req: Request<MongoIdParam, unknown, UpdatePiDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;

      // Erro TS(2345): Convertido 'empresaId' para string.
      const piAtualizada = await this.service.update(
        id,
        dto,
        empresaId.toString(),
      );

      // Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: piAtualizada,
      });
    } catch (error) {
      // Passa erros (ex: 404)
      next(error);
    }
  }

  /**
   * Deleta uma PI.
   * Rota: DELETE /api/v1/pis/:id
   */
  async deletePI(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      // Erro TS(2345): Convertido 'empresaId' para string.
      await this.service.delete(id, empresaId.toString());

      // (Resposta 204 é o padrão correto para DELETE sem conteúdo)
      res.status(204).send();
    } catch (error) {
      // Passa erros (ex: 404)
      next(error);
    }
  }

  /**
   * Gera e faz o download do PDF da PI.
   * Rota: GET /api/v1/pis/:id/download
   */
  async downloadPI_PDF(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { empresaId, id: userId } = req.user!;
      const { id: piId } = req.params;

      // Erro TS(2345): Convertido 'empresaId' e 'userId' para string.
      await this.service.generatePDF(
        piId,
        empresaId.toString(),
        userId.toString(),
        res,
      );
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const piController = new PiController(piService);