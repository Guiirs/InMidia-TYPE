import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { logger } from '@/config/logger';
import {
  IUser,
  IUserDocument,
} from '@/db/models/user.model';
import {
  userRepository,
  UserRepository,
} from '@/db/repositories/user.repository';
import {
  empresaRepository,
  EmpresaRepository,
} from '@/db/repositories/empresa.repository';
import { HttpError } from '@/utils/errors/httpError';
import {
  comparePassword,
  hashPassword,
} from '@/security/index';
import {
  UpdateUserProfileDto,
  RegenerateApiKeyDto,
} from '@/utils/validators/user.validator';

/**
 * Serviço responsável pela lógica de negócios do Utilizador (Perfil)
 * e ações de gestão da Empresa (Admin).
 */
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  /**
   * Obtém os dados do perfil de um utilizador.
   * (Migração de services/userService.js -> getProfile)
   *
   * @param userId - ID do utilizador (do token JWT)
   * @returns Os dados públicos do utilizador.
   */
  async getProfile(userId: string | Types.ObjectId): Promise<IUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      logger.warn(`[UserService] getProfile falhou: Utilizador ${userId} não encontrado.`);
      throw new HttpError('Utilizador não encontrado.', 404);
    }
    return user.toJSON();
  }

  /**
   * Atualiza os dados do perfil de um utilizador.
   * (Migração de services/userService.js -> updateProfile)
   *
   * @param userId - ID do utilizador (do token JWT)
   * @param dto - Dados a atualizar (email, username, password, etc.)
   * @returns Os dados atualizados do utilizador.
   */
  async updateProfile(
    userId: string | Types.ObjectId,
    dto: UpdateUserProfileDto,
  ): Promise<IUser> {
    logger.info(`[UserService] Tentando atualizar perfil para utilizador ID: ${userId}.`);
    
    // Prepara os dados para atualização (copia segura do DTO)
    const updateData: Partial<IUserDocument> = { ...dto };

    // Se a senha foi fornecida, faz o hash
    if (dto.password) {
      // A validação de min 6 caracteres já foi feita pelo Zod (user.validator.ts)
      updateData.password = await hashPassword(dto.password);
    }
    
    if (dto.email) {
      updateData.email = dto.email.toLowerCase();
    }
    
    try {
      const updatedUser = await this.userRepo.findByIdAndUpdate(userId, updateData);

      if (!updatedUser) {
        logger.warn(`[UserService] updateProfile falhou: Utilizador ${userId} não encontrado.`);
        throw new HttpError('Utilizador não encontrado para atualização.', 404);
      }

      logger.info(`[UserService] Perfil do utilizador ${updatedUser.username} (ID: ${userId}) atualizado.`);
      return updatedUser.toJSON(); // Retorna o DTO (sem senha)
      
    } catch (error: unknown) {
      // Trata erro de chave duplicada (username ou email)
      if (error instanceof Error && (error as any).code === 11000) {
        const keyValue = (error as any).keyValue;
        const campo = Object.keys(keyValue)[0];
         logger.warn(`[UserService] updateProfile falhou (Duplicado 11000): ${campo} = ${keyValue[campo]}`);
        throw new HttpError(
          `Este ${campo} (${keyValue[campo]}) já está em uso.`,
          409,
        );
      }
      logger.error(error, `[UserService] Erro ao atualizar perfil ${userId}`);
      throw error; // Repassa outros erros (HttpError ou genéricos)
    }
  }

  /**
   * Obtém os dados da empresa associada (apenas Admin).
   * (Migração de services/userService.js -> getEmpresaProfile)
   *
   * @param empresaId - ID da empresa (do token JWT)
   * @param userRole - Role do utilizador (do token JWT)
   * @returns Os dados da empresa.
   */
  async getEmpresaProfile(
    empresaId: string | Types.ObjectId,
    userRole: 'admin' | 'user',
  ) {
    logger.info(`[UserService] Utilizador (Role: ${userRole}) buscando perfil da empresa ID: ${empresaId}.`);
    
    // (A lógica de permissão (role) será movida para o 'admin.middleware.ts'
    // ou verificada no controlador, mas mantemos a verificação aqui
    // para replicar a segurança do JS original).
    if (userRole !== 'admin') {
      throw new HttpError(
        'Acesso negado. Apenas administradores podem aceder aos detalhes da empresa.',
        403,
      );
    }
    
    const empresa = await this.empresaRepo.findById(empresaId);

    if (!empresa) {
      throw new HttpError('Empresa não encontrada.', 404);
    }
    
    // O .toJSON() removerá campos sensíveis (como api_key_hash)
    return empresa.toJSON();
  }

  /**
   * Regenera a API Key de uma empresa, verificando a senha do admin.
   * (Migração de services/userService.js -> regenerateApiKey)
   *
   * @param userId - ID do admin
   * @param empresaId - ID da empresa
   * @param userRole - Role do admin
   * @param dto - DTO com a senha de confirmação
   * @returns A nova chave completa (segredo + prefixo) e o novo prefixo.
   */
  async regenerateApiKey(
    userId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    userRole: 'admin' | 'user',
    dto: RegenerateApiKeyDto,
  ) {
    // 1. Apenas Admins podem regenerar
    if (userRole !== 'admin') {
      throw new HttpError(
        'Acesso negado. Apenas administradores podem regenerar a chave de API.',
        403,
      );
    }

    // 2. Verificar a senha do administrador (do repositório, com +password)
    const user = await this.userRepo.findByIdWithPassword(userId);
    if (!user || !user.password) {
      throw new HttpError('Utilizador administrador não encontrado.', 404);
    }
    
    const passwordMatch = await comparePassword(dto.password, user.password);
    if (!passwordMatch) {
      throw new HttpError('Senha incorreta. Verificação falhou.', 401);
    }
    
    // 3. Buscar a empresa
    const empresa = await this.empresaRepo.findById(empresaId);
    if (!empresa) {
      throw new HttpError('Empresa associada não encontrada.', 404);
    }

    // 4. Gerar nova chave (lógica do userService.js original)
    const prefixBase =
      empresa.nome.substring(0, 4).toLowerCase().replace(/[^a-z]/g, '') ||
      'emp';
    const newApiKeyPrefix = `${prefixBase}_${uuidv4().split('-')[0].substring(0, 4)}`;
    const newApiKeySecret = uuidv4();
    const newApiKeyHash = await hashPassword(newApiKeySecret);
    const newFullApiKey = `${newApiKeyPrefix}_${newApiKeySecret}`;

    // 5. Atualizar a empresa com os novos valores
    empresa.api_key_hash = newApiKeyHash;
    empresa.api_key_prefix = newApiKeyPrefix;
    await this.empresaRepo.save(empresa);

    logger.info(`[UserService] API Key regenerada para empresa ${empresaId} por admin ${userId}.`);

    // 6. Retornar a *nova* chave completa (para o utilizador copiar)
    return {
      fullApiKey: newFullApiKey,
      newApiKeyPrefix: newApiKeyPrefix,
    };
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const userService = new UserService(userRepository, empresaRepository);