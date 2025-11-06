import { Request, Response, NextFunction } from 'express';
import {
  aluguelService,
  AluguelService,
} from '@/api/services/src/aluguel.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
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
   * (Migração de controllers/aluguelController.js -> getAlugueisByPlaca)
   * Rota: GET /api/v1/alugueis/placa/:placaId
   */
  async getAlugueisByPlaca(
    req: Request<PlacaIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { placaId } = req.params; // ID validado pelo Zod

      const alugueis = await this.service.getAlugueisByPlaca(
        placaId,
        empresaId,
      );

      // (Resposta 200)
      res.status(200).json(alugueis);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo aluguel (reserva).
   * (Migração de controllers/aluguelController.js -> createAluguel)
   * Rota: POST /api/v1/alugueis
   */
  async createAluguel(
    req: Request<unknown, unknown, CreateAluguelDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const dto = req.body; // DTO validado pelo Zod

      const novoAluguel = await this.service.createAluguel(dto, empresaId);

      // (Resposta 201)
      res.status(201).json(novoAluguel);
    } catch (error) {
      // Passa erros (ex: 409 Conflito de datas)
      next(error);
    }
  }

  /**
   * Apaga (cancela) um aluguel.
   * (Migração de controllers/aluguelController.js -> deleteAluguel)
   * Rota: DELETE /api/v1/alugueis/:id
   */
  async deleteAluguel(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id: aluguelId } = req.params; // ID validado pelo Zod

      const result = await this.service.deleteAluguel(aluguelId, empresaId);

      // (Resposta 200)
      res.status(200).json(result); // Retorna { success: true, message: '...' }
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