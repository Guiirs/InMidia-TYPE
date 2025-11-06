import { Request, Response, NextFunction } from 'express';
// [CORREÇÃO] Importação ajustada para usar o barrel file de serviços.
import {
  aluguelService,
  AluguelService,
} from '@/api/services';
// [NOTA] 'logger' importado mas não utilizado; pode ser removido.
//import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import { CreateAluguelDto } from '@/utils/validators/aluguel.validator';

// Tipos para os parâmetros de rota
type MongoIdParam = { id: string };
type PlacaIdParam = { placaId: string };

/**
 * Controlador para lidar com as rotas de Aluguéis (/alugueis).
 * (Migração de controllers/aluguelController.js)
 */
export class AluguelController {
  constructor(private readonly service: AluguelService) {}

  /**
   * Obtém o histórico de alugueis de uma placa específica.
   * Rota: GET /api/v1/alugueis/placa/:placaId
   */
  async getAlugueisByPlaca(
    req: Request<PlacaIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { placaId } = req.params; // ID validado pelo Zod

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const alugueis = await this.service.getAlugueisByPlaca(
        placaId,
        empresaId.toString(),
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: alugueis,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo aluguel (reserva).
   * Rota: POST /api/v1/alugueis
   */
  async createAluguel(
    req: Request<unknown, unknown, CreateAluguelDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const dto = req.body; // DTO validado pelo Zod

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const novoAluguel = await this.service.createAluguel(
        dto,
        empresaId.toString(),
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(201).json({
        status: 'success',
        data: novoAluguel,
      });
    } catch (error) {
      // Passa erros (ex: 409 Conflito de datas)
      next(error);
    }
  }

  /**
   * Apaga (cancela) um aluguel.
   * Rota: DELETE /api/v1/alugueis/:id
   */
  async deleteAluguel(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id: aluguelId } = req.params; // ID validado pelo Zod

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' para string.
      const result = await this.service.deleteAluguel(
        aluguelId,
        empresaId.toString(),
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      // (O serviço já retorna { success: true, message: '...' })
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      // Passa erros (ex: 404 Não Encontrado)
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const aluguelController = new AluguelController(aluguelService);