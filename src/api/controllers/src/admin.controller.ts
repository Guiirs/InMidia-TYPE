import { Request, Response, NextFunction } from 'express';
import { adminService, AdminService } from '@/api/services/src/admin.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import {
  CreateUserDto,
  UpdateUserRoleDto,
} from '@/utils/validators/admin.validator';

// Tipos para os parâmetros de rota (reutilizando a definição do Zod)
type MongoIdParam = { id: string };

/**
 * Controlador para lidar com as rotas de Administração (/admin/...).
 * (Migração de controllers/adminController.js)
 */
export class AdminController {
  constructor(private readonly service: AdminService) {}

  /**
   * Cria um novo utilizador (convidado) na empresa.
   * (Migração de controllers/adminController.js -> createUser)
   * Rota: POST /api/v1/admin/users
   */
  async createUser(
    req: Request<unknown, unknown, CreateUserDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // O admin.middleware garante que req.user existe e é admin
      const { empresaId } = req.user!;
      const dto = req.body;

      const createdUser = await this.service.createUser(dto, empresaId);

      // (Resposta 201)
      res.status(201).json(createdUser);
    } catch (error) {
      // Passa erros (ex: 409 Duplicado) para o errorHandler
      next(error);
    }
  }

  /**
   * Obtém todos os utilizadores da empresa.
   * (Migração de controllers/adminController.js -> getAllUsers)
   * Rota: GET /api/v1/admin/users
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId } = req.user!;
      const users = await this.service.getAllUsers(empresaId);
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza a role de um utilizador.
   * (Migração de controllers/adminController.js -> updateUserRole)
   * Rota: PUT /api/v1/admin/users/:id/role
   */
  async updateUserRole(
    req: Request<MongoIdParam, unknown, UpdateUserRoleDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { empresaId } = req.user!;
      const { id: userIdToUpdate } = req.params;
      const dto = req.body;

      const result = await this.service.updateUserRole(
        userIdToUpdate,
        dto,
        empresaId,
      );

      // (Resposta 200)
      res.status(200).json(result);
    } catch (error) {
      // Passa erros (ex: 404 Não Encontrado)
      next(error);
    }
  }

  /**
   * Apaga um utilizador.
   * (Migração de controllers/adminController.js -> deleteUser)
   * Rota: DELETE /api/v1/admin/users/:id
   */
  async deleteUser(
    req: Request<MongoIdParam>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: adminUserId, empresaId } = req.user!;
      const { id: userIdToDelete } = req.params;

      await this.service.deleteUser(userIdToDelete, adminUserId as string, empresaId);

      // (Resposta 204)
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