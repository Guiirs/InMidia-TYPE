import { Types } from 'mongoose';
import { logger } from '@/config/logger';
import {
  IUser,
} from '@/db/models/user.model';
import {
  userRepository,
  UserRepository,
} from '@/db/repositories/user.repository';
import { HttpError } from '@/utils/errors/httpError';
import { hashPassword } from '@/security/auth/password';
import {
  CreateUserDto,
  UpdateUserRoleDto,
} from '@/utils/validators/admin.validator';

/**
 * Serviço responsável pela lógica de negócios de Administração
 * (Gestão de Utilizadores).
 * (Migração de services/adminService.js)
 */
export class AdminService {
  constructor(private readonly userRepo: UserRepository) {}

  /**
   * Cria um novo utilizador (convidado) dentro da empresa do admin.
   * (Migração de services/adminService.js -> createUser)
   *
   * @param dto - Dados do novo utilizador (validados pelo Zod)
   * @param empresaId - ID da empresa (vinda do token do admin)
   * @returns O novo utilizador (sem senha).
   */
  async createUser(
    dto: CreateUserDto,
    empresaId: string | Types.ObjectId,
  ): Promise<IUser> {
    const { email, username, password, nome, sobrenome, role } = dto;

    // 1. Verifica se já existe um utilizador com o mesmo username OU email
    //    NAQUELA empresa (lógica do adminService.js original)
    const userExists = await this.userRepo.findByEmailOrUsernameInCompany(
      email,
      username,
      empresaId,
    );

    if (userExists) {
      const field = userExists.username === username ? 'nome de utilizador' : 'email';
      logger.warn(
        `[AdminService] Tentativa de criar utilizador duplicado (${field}) na empresa ${empresaId}`,
      );
      throw new HttpError(
        `Já existe um utilizador com este ${field} na sua empresa.`,
        409, // Conflict
      );
    }

    // 2. Hashea a senha
    const hashedPassword = await hashPassword(password);

    // 3. Cria o utilizador
    try {
      const newUser = await this.userRepo.create({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        nome,
        sobrenome,
        role: role || 'user',
        empresa: new Types.ObjectId(empresaId),
      });

      logger.info(
        `[AdminService] Utilizador ${newUser.username} (ID: ${newUser.id}) criado para empresa ${empresaId}.`,
      );
      return newUser.toJSON(); // Retorna o DTO (sem senha)
    } catch (error: unknown) {
      // Fallback para erros de índice (caso o 'unique: true' global nos modelos falhe)
      if (error instanceof Error && (error as any).code === 11000) {
        logger.warn(
          `[AdminService] Falha no registo (Duplicado 11000 Global): ${(error as any).keyValue}`,
        );
        throw new HttpError(
          `O email ou username fornecido já está em uso global.`,
          409,
        );
      }
      logger.error(error, '[AdminService] Erro ao criar utilizador no repositório');
      throw error;
    }
  }

  /**
   * Obtém todos os utilizadores de uma empresa.
   * (Migração de services/adminService.js -> getAllUsers)
   *
   * @param empresaId - ID da empresa (do token do admin)
   * @returns Array de dados dos utilizadores.
   */
  async getAllUsers(empresaId: string | Types.ObjectId): Promise<IUser[]> {
    logger.info(
      `[AdminService] Buscando todos os utilizadores para empresa ${empresaId}.`,
    );
    // O repositório já faz o select e retorna .toJSON() (ou .lean() se preferirmos)
    const users = await this.userRepo.findAllByCompany(empresaId);
    return users.map(user => user.toJSON());
  }

  /**
   * Atualiza a role ('admin' ou 'user') de um utilizador específico.
   * (Migração de services/adminService.js -> updateUserRole)
   *
   * @param userIdToUpdate - ID do utilizador a ser atualizado
   * @param dto - Contém a nova 'role'
   * @param empresaId - ID da empresa (do token do admin)
   */
  async updateUserRole(
    userIdToUpdate: string | Types.ObjectId,
    dto: UpdateUserRoleDto,
    empresaId: string | Types.ObjectId,
  ): Promise<{ message: string }> {
    logger.info(
      `[AdminService] Tentando atualizar role do utilizador ${userIdToUpdate} para ${dto.role} na empresa ${empresaId}.`,
    );

    // (A validação da Role ('admin'/'user') já foi feita pelo Zod)
    const result = await this.userRepo.updateOne(
      { _id: userIdToUpdate, empresa: empresaId },
      { role: dto.role },
    );

    // Verifica se algum documento foi encontrado (lógica do original)
    if (result.matchedCount === 0) {
      throw new HttpError('Utilizador não encontrado na sua empresa.', 404);
    }

    if (result.modifiedCount === 0) {
      logger.info(
        `[AdminService] Role do utilizador ${userIdToUpdate} já era '${dto.role}'. Nenhuma alteração feita.`,
      );
    }

    return { message: 'Nível de acesso do utilizador atualizado com sucesso!' };
  }

  /**
   * Apaga um utilizador, impedindo que um admin apague a própria conta.
   * (Migração de services/adminService.js -> deleteUser)
   *
   * @param userIdToDelete - ID do utilizador a ser apagado
   * @param adminUserId - ID do admin que está a fazer a requisição
   * @param empresaId - ID da empresa (do token do admin)
   */
  async deleteUser(
    userIdToDelete: string,
    adminUserId: string,
    empresaId: string | Types.ObjectId,
  ): Promise<{ success: boolean }> {
    logger.info(
      `[AdminService] Admin ${adminUserId} tentando apagar utilizador ${userIdToDelete} na empresa ${empresaId}.`,
    );

    // Verifica auto-deleção (lógica do original)
    if (userIdToDelete === adminUserId) {
      throw new HttpError(
        'Não é possível apagar a sua própria conta de administrador.',
        400, // Bad Request
      );
    }

    const result = await this.userRepo.deleteOne({
      _id: userIdToDelete,
      empresa: empresaId,
    });

    // Verifica se algum documento foi encontrado (lógica do original)
    if (result.deletedCount === 0) {
      throw new HttpError('Utilizador não encontrado na sua empresa.', 404);
    }

    logger.info(
      `[AdminService] Utilizador ${userIdToDelete} apagado com sucesso pelo admin ${adminUserId}.`,
    );
    return { success: true };
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const adminService = new AdminService(userRepository);