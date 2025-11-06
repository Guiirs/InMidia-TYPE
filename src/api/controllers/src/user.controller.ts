import { Request, Response, NextFunction } from 'express';
import { userService, UserService } from '@/api/services/src/user.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod (que já criámos)
import {
  UpdateUserDto,
  UpdatePasswordDto,
} from '@/utils/validators/user.validator';

/**
 * Controlador para lidar com as rotas de Usuário autenticado (/user).
 * (Migração de controllers/userController.js)
 */
export class UserController {
  constructor(private readonly service: UserService) {}

  /**
   * Busca os dados do Usuário autenticado (perfil).
   * (Migração de controllers/userController.js -> getProfile)
   * Rota: GET /api/v1/user/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // O ID do usuário vem do JWT (req.user!)
      const { id } = req.user!;

      // Busca o perfil (inclui Empresa e Regiões)
      const user = await this.service.getProfile(id);

      // (Resposta 200)
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza os dados do Usuário autenticado (excluindo password).
   * (Migração de controllers/userController.js -> updateProfile)
   * Rota: PUT /api/v1/user/profile
   */
  async updateProfile(
    req: Request<unknown, unknown, UpdateUserDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.user!; // ID do usuário autenticado
      const dto = req.body; // DTO validado

      const updatedUser = await this.service.updateProfile(id, dto);

      // (Resposta 200)
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza a password do Usuário autenticado.
   * (Migração de controllers/userController.js -> updatePassword)
   * Rota: PUT /api/v1/user/password
   */
  async updatePassword(
    req: Request<unknown, unknown, UpdatePasswordDto>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.user!; // ID do usuário autenticado
      const { oldPassword, newPassword } = req.body; // DTO validado

      await this.service.updatePassword(id, oldPassword, newPassword);

      // (Resposta 204)
      res.status(204).send();
    } catch (error) {
      // Passa erro (ex: 400 password antiga incorreta)
      next(error);
    }
  }

  /**
   * Faz o upload do avatar do Usuário autenticado.
   * (Migração de controllers/userController.js -> uploadAvatar)
   * Rota: POST /api/v1/user/avatar
   */
  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!; // ID do usuário autenticado

      // O middleware de upload (Multer) anexa o ficheiro a req.file
      if (!req.file) {
        logger.error('Nenhum arquivo de avatar fornecido para o usuário: %s', id);
        // Em vez de retornar um erro específico de ficheiro aqui, confiaremos no Zod
        // ou no uploadMiddleware para lidar com isso, mas para manter a funcionalidade
        // original, lançaremos um erro padrão.
        throw new Error('Nenhum ficheiro de avatar fornecido.');
      }

      const filePath = req.file.path;

      // O serviço fará o processamento da imagem e atualização da URL
      const updatedUser = await this.service.uploadAvatar(id, filePath);

      // (Resposta 200)
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const userController = new UserController(userService);