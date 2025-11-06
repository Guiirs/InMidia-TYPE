import { Request, Response, NextFunction } from 'express';
import {
  empresaService,
  EmpresaService,
} from '@/api/services/src/empresa.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos em user.validator.ts)
import { UpdateEmpresaDto } from '@/utils/validators/user.validator';

/**
 * Controlador para lidar com as rotas diretas da Entidade Empresa.
 * (Migração de controllers/empresaController.js -> updateEmpresaDetails)
 */
export class EmpresaController {
  constructor(private readonly service: EmpresaService) {}

  /**
   * Atualiza os detalhes da empresa (Nome, Endereço, etc.)
   * (Migração de controllers/empresaController.js -> updateEmpresaDetails)
   * Rota: PUT /api/v1/empresa/details
   */
  async updateEmpresaDetails(
    req: Request<unknown, unknown, UpdateEmpresaDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // authMiddleware (JWT) garante que req.user existe
      // adminMiddleware (Role) garante que é um admin
      const { empresaId } = req.user!;
      const dto = req.body;

      const empresaAtualizada = await this.service.updateEmpresaDetails(
        empresaId,
        dto,
      );

      // Resposta (lógica do JS original)
      res.status(200).json({
        status: 'success',
        message: 'Detalhes da empresa atualizados com sucesso.',
        data: empresaAtualizada,
      });
    } catch (error) {
      // Passa erros (ex: 404, 409 Duplicado CNPJ) para o errorHandler
      next(error);
    }
  }

  // (Nota: getEmpresaDetails, getApiKey, regenerateApiKey foram movidos
  // para user.controller.ts pois são ações do *utilizador* sobre a sua empresa,
  // alinhando-se melhor com as rotas /user/me/... do JS original)
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const empresaController = new EmpresaController(empresaService);