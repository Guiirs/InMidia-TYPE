import { Request, Response, NextFunction } from 'express';
// Importação ajustada para usar o barrel file de serviços.
import { adminService, AdminService } from '@/api/services';
// import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import {
  CreateUserDto,
  UpdateUserRoleDto,
} from '@/utils/validators/admin.validator';

// Tipos para os parâmetros de rota
type MongoIdParam = { id: string };

/**
 * Controlador para lidar com as rotas de Administração (/admin/...).
 * (Migração de controllers/adminController.js)
 */
export class AdminController {
  constructor(private readonly service: AdminService) {}

  /**
   * Cria um novo utilizador (convidado) na empresa.
   * Rota: POST /api/v1/admin/users
   */
  async createUser(
    req: Request<unknown, unknown, CreateUserDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      // O admin.middleware garante que req.user existe e é admin
      const { empresaId } = req.user!;
      const dto = req.body;

      // [CORREÇÃO 4.1] Erro TS(2345): Convertido 'empresaId' para string.
      const createdUser = await this.service.createUser(
        dto,
        empresaId.toString(),
      );

      return res.status(201).json({
        status: 'success',
        data: createdUser,
      });
    } catch (error) {
      // Passa erros (ex: 409 Duplicado) para o errorHandler
      next(error);
    }
  }

  /**
   * Obtém todos os utilizadores da empresa.
   * Rota: GET /api/v1/admin/users
   */
  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;

      // [CORREÇÃO 4.1] Erro TS(2345): Convertido 'empresaId' para string.
      const users = await this.service.getAllUsers(empresaId.toString());

      return res.status(200).json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza a role de um utilizador.
   * Rota: PUT /api/v1/admin/users/:id/role
   */
  async updateUserRole(
    req: Request<MongoIdParam, unknown, UpdateUserRoleDto>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id: userIdToUpdate } = req.params;
      const dto = req.body;

      // [CORREÇÃO 4.1] Erro TS(2345): Convertido 'empresaId' para string.
      const result = await this.service.updateUserRole(
        userIdToUpdate,
        dto,
        empresaId.toString(),
      );

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      // Passa erros (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Apaga um utilizador.
   * Rota: DELETE /api/v1/admin/users/:id
   */
  async deleteUser(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { id: adminUserId, empresaId } = req.user!;
      const { id: userIdToDelete } = req.params;

      // [CORREÇÃO 4.1] Erro TS(2345):
      // O tipo de req.user.id (adminUserId) é 'string | Types.ObjectId'.
      // O service.deleteUser() espera 'string'.
      // Usamos .toString() para garantir a conversão segura.
      await this.service.deleteUser(
        userIdToDelete,
        adminUserId.toString(),
        empresaId.toString(),
      );

      // (Resposta 204 é o padrão correto para DELETE sem conteúdo)
      res.status(204).send();
    } catch (error) {
      // Passa erros (ex: 400 Auto-deleção, 404 Não Encontrado)
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const adminController = new AdminController(adminService);