/*
 * Arquivo: src/api/controllers/empresa.controller.ts
 * Descrição: Controlador para as rotas de Empresa.
 * (Migração de controllers/empresaController.js)
 *
 * [Nota] Comentários originais sobre correções de bugs (TS2339)
 * foram mantidos, pois são relevantes para o histórico do arquivo.
 */

import { Request, Response, NextFunction } from 'express';
import { UpdateEmpresaDto } from '@/utils/validators/user.validator';
// [CORREÇÃO] Importação ajustada para usar o barrel file de serviços.
import {
  empresaService,
  EmpresaService,
} from '@/api/services';
// import { logger } from '@/config/logger';

export class EmpresaController {
  constructor(private readonly service: EmpresaService) {}

  /**
   * Busca os dados da empresa do utilizador (Admin).
   * Rota: GET /api/v1/empresa/details
   */
  async getEmpresaDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      // O adminMiddleware já protege esta rota
      const { empresaId } = req.user!;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' (string | ObjectId) para string.
      // [Nota] O comentário [FIX] original estava correto ao usar findEmpresaById.
      const empresa = await this.service.findEmpresaById(empresaId.toString());

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: empresa,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza os dados da empresa (Admin).
   * Rota: PUT /api/v1/empresa/details
   */
  async updateEmpresaDetails(
    // O tipo DTO vem do user.validator.ts (UpdateEmpresaDto)
    req: Request<unknown, unknown, UpdateEmpresaDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      // O adminMiddleware já protege esta rota
      const { empresaId } = req.user!;
      const dto = req.body;

      // [CORREÇÃO] Erro TS(2345): Convertido 'empresaId' (string | ObjectId) para string.
      const empresa = await this.service.updateEmpresaDetails(
        empresaId.toString(),
        dto,
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: empresa,
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const empresaController = new EmpresaController(empresaService);