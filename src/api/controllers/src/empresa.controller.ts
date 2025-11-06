/*
 * Arquivo: src/api/controllers/src/empresa.controller.ts
 * Descrição: Controlador para as rotas de Empresa.
 * (Migração de controllers/empresaController.js)
 *
 * Alterações (Correção de Bug TS2339):
 * 1. [FIX] Corrigida a chamada ao serviço dentro de `getEmpresaDetails`.
 * 2. Em vez de chamar `this.service.getEmpresaDetails` (que não existe),
 * o método agora chama `this.service.findEmpresaById`, que é
 * o método correto no `EmpresaService`.
 * 3. Os métodos `getEmpresaDetails` e `updateEmpresaDetails`
 * foram mantidos para corresponder ao que as rotas esperam.
 */

import { Request, Response, NextFunction } from 'express';
import { UpdateEmpresaDto } from '@/utils/validators/user.validator';
import {
  empresaService,
  EmpresaService,
} from '@/api/services/src/empresa.service';
// import { logger } from '@/config/logger';

export class EmpresaController {
  constructor(private readonly service: EmpresaService) {}

  /**
   * Busca os dados da empresa do utilizador (Admin).
   * Rota: GET /api/v1/empresa/details
   */
  async getEmpresaDetails(req: Request, res: Response, next: NextFunction) {
    try {
      // O adminMiddleware já protege esta rota
      const { empresaId } = req.user!;
      // [FIX] Chama o método correto no serviço: findEmpresaById
      const empresa = await this.service.findEmpresaById(empresaId);
      res.status(200).json(empresa);
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
  ) {
    try {
      // O adminMiddleware já protege esta rota
      const { empresaId } = req.user!;
      const dto = req.body;
      // O método 'updateEmpresaDetails' existe no serviço
      const empresa = await this.service.updateEmpresaDetails(empresaId, dto);
      res.status(200).json(empresa);
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const empresaController = new EmpresaController(empresaService);