/*
 * Arquivo: src/api/controllers/user.controller.ts
 * Descrição: Controlador para as rotas de Usuário autenticado (/user).
 *
 * Alterações (Correção de Bug TS2339):
 * [Nota] Os comentários originais sobre correções de bugs (TS2339)
 * e remoção/adição de métodos foram mantidos, pois são relevantes
 * para o histórico do arquivo.
 */

import { Request, Response, NextFunction } from 'express';
// [CORREÇÃO] Importação ajustada para usar o barrel file de serviços.
import { userService, UserService } from '@/api/services';
//import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import {
  UpdateUserProfileDto,
  RegenerateApiKeyDto,
} from '@/utils/validators/user.validator';

/**
 * Controlador para lidar com as rotas de Usuário autenticado (/user).
 * (Migração de controllers/userController.js)
 */
export class UserController {
  constructor(private readonly service: UserService) {}

  /**
   * Busca os dados do Usuário autenticado (perfil).
   * Rota: GET /api/v1/user/me
   */
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      // req.user é garantido pelo authMiddleware
      const { id } = req.user!;
      const user = await this.service.getProfile(id);

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza os dados do Usuário autenticado (excluindo password).
   * Rota: PUT /api/v1/user/me
   */
  async updateProfile(
    // Tipagem de DTO vinda dos validadores Zod
    req: Request<unknown, unknown, UpdateUserProfileDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { id } = req.user!;
      const dto = req.body;

      const updatedUser = await this.service.updateProfile(id, dto);

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [NOVO - CORRIGIDO] Busca os dados da empresa do utilizador (Admin).
   * Rota: GET /api/v1/user/me/empresa
   */
  async getEmpresaProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId, role } = req.user!;
      // A lógica de permissão (role) já é verificada pelo adminMiddleware na rota
      const empresa = await this.service.getEmpresaProfile(empresaId, role);

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
   * [NOVO - CORRIGIDO] Regenera a API Key da empresa (Admin).
   * Rota: POST /api/v1/user/me/empresa/regenerate-api-key
   */
  async regenerateApiKey(
    req: Request<unknown, unknown, RegenerateApiKeyDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { id, empresaId, role } = req.user!;
      const dto = req.body; // Senha de confirmação

      const result = await this.service.regenerateApiKey(
        id,
        empresaId,
        role,
        dto,
      );

      // [CORREÇÃO] Padronização da resposta (JSend) e retorno explícito.
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /*
   * [REMOVIDO] Os métodos updatePassword e uploadAvatar estavam neste
   * ficheiro, mas não eram chamados por 'user.routes.ts'.
   * Se forem necessários, precisam de rotas próprias.
   */
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const userController = new UserController(userService);