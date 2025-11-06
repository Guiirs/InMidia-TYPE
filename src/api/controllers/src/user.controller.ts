/*
 * Arquivo: src/api/controllers/src/user.controller.ts
 * Descrição: Controlador para as rotas de Usuário autenticado (/user).
 *
 * Alterações (Correção de Bug TS2339):
 * 1. [FIX] Adicionados os métodos `getEmpresaProfile` e `regenerateApiKey`.
 * 2. Estes métodos estavam a ser chamados pelo `user.routes.ts`, mas
 * não estavam implementados neste controlador.
 * 3. A lógica destes novos métodos chama os métodos correspondentes no
 * `userService` (que já existiam).
 * 4. [REMOVIDO] Removidas as importações não utilizadas de
 * `UpdateUserDto` e `UpdatePasswordDto`, pois as rotas que as usam
 * não estavam neste ficheiro (`user.routes.ts`).
 * 5. [REMOVIDO] Removidos os métodos `updatePassword` e `uploadAvatar`,
 * pois não são chamados por nenhuma rota no `user.routes.ts`.
 */

import { Request, Response, NextFunction } from 'express';
import { userService, UserService } from '@/api/services/src/user.service';
//import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
// [REMOVIDO] import { UpdateUserDto, UpdatePasswordDto } from '@/utils/validators/user.validator';
import { UpdateUserProfileDto } from '@/utils/validators/user.validator';
import { RegenerateApiKeyDto } from '@/utils/validators/user.validator';

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
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!;
      const user = await this.service.getProfile(id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza os dados do Usuário autenticado (excluindo password).
   * Rota: PUT /api/v1/user/me
   */
  async updateProfile(
    req: Request<unknown, unknown, UpdateUserProfileDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.user!;
      const dto = req.body;

      const updatedUser = await this.service.updateProfile(id, dto);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [NOVO - CORRIGIDO] Busca os dados da empresa do utilizador (Admin).
   * Rota: GET /api/v1/user/me/empresa
   */
  async getEmpresaProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, role } = req.user!;
      // A lógica de permissão (role) já é verificada pelo adminMiddleware na rota
      const empresa = await this.service.getEmpresaProfile(empresaId, role);
      res.status(200).json(empresa);
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
  ) {
    try {
      const { id, empresaId, role } = req.user!;
      const dto = req.body; // Senha de confirmação

      const result = await this.service.regenerateApiKey(
        id,
        empresaId,
        role,
        dto,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /*
   * [REMOVIDO] Os métodos updatePassword e uploadAvatar estavam neste
   * ficheiro, mas não eram chamados por 'user.routes.ts'.
   * Se forem necessários, precisam de rotas próprias.
   */
  // async updatePassword(...)
  // async uploadAvatar(...)
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const userController = new UserController(userService);