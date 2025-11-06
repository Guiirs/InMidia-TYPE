import { Request, Response, NextFunction } from 'express';
// [CORREÇÃO] Importação ajustada para usar o barrel file de serviços.
import { regiaoService, RegiaoService } from '@/api/services';
// [NOTA] 'logger' importado mas não utilizado; pode ser removido.
//import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
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
   * Rota: GET /api/v1/regioes
   */
  async getAllRegioes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const regioes = await this.service.getAll(empresaId.toString());

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: regioes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova região.
   * Rota: POST /api/v1/regioes
   */
  async createRegiao(
    req: Request<unknown, unknown, CreateRegiaoDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.body;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const novaRegiao = await this.service.create(dto, empresaId.toString());

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(201).json({
        status: 'success',
        data: novaRegiao,
      });
    } catch (error) {
      // Passa erros (ex: 409 Duplicado) para o errorHandler
      next(error);
    }
  }

  /**
   * Atualiza o nome de uma região.
   * Rota: PUT /api/v1/regioes/:id
   */
  async updateRegiao(
    req: Request<MongoIdParam, unknown, UpdateRegiaoDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      const dto = req.body;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const regiaoAtualizada = await this.service.update(
        id, // id (de req.params) já é string
        dto,
        empresaId.toString(),
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: regiaoAtualizada,
      });
    } catch (error) {
      // Passa erros (ex: 404, 409 Duplicado)
      next(error);
    }
  }

  /**
   * Apaga uma região.
   * Rota: DELETE /api/v1/regioes/:id
   */
  async deleteRegiao(
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
    } catch (error)
      // Passa erros (ex: 400 Região em uso, 404 Não Encontrado)
      { 
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const regiaoController = new RegiaoController(regiaoService);