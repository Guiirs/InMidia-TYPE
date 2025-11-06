/*
 * Arquivo: /db/repositories/user.repository.ts
 *
 * Resumo das Alterações:
 * 1. Importações atualizadas para usar os novos tipos de modelo (UserDocument, UserModel, IUser).
 * 2. Tipos de retorno ajustados para diferenciar Documentos Mongoose (Hydrated) de objetos Lean (POJO).
 *
 * Motivo das Mudanças:
 * A função `findByEmailOrUsernameInCompany` usa `.lean()` e, portanto, deve retornar
 * a interface base `IUser | null` (POJO). Funções que retornam documentos hidratados
 * (como `findById`) agora usam o tipo `UserDocument` para resolver os erros de `FlattenMaps`.
 */

import { Types, ClientSession, FilterQuery, UpdateQuery } from 'mongoose';
import {
  UserModel,
  UserDocument, // Importa o tipo HydratedDocument
  IUser, // Importa a interface base (POJO)
} from '@/db/models/user.model';

/**
 * Repositório para abstrair as operações de banco de dados do modelo User.
 * Ele é instanciado pelos serviços, que injetam o Modelo Mongoose.
 */
export class UserRepository {
  // O modelo Mongoose é injetado pelo construtor
  constructor(private readonly userModel: UserModel) {}

  /**
   * Encontra um usuário pelo ID.
   * (Usado para 'getProfile' no userService)
   * @param id - O ID do usuário (string ou ObjectId)
   * @returns O documento do usuário (sem senha) ou null.
   */
  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Encontra um usuário pelo ID e força a inclusão da senha.
   * (Usado para 'regenerateApiKey' no userService)
   * @param id - O ID do usuário (string ou ObjectId)
   * @returns O documento do usuário (COM senha) ou null.
   */
  async findByIdWithPassword(
    id: string | Types.ObjectId,
  ): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+password').exec();
  }

  /**
   * Encontra um usuário pelo email OU username e força a inclusão da senha.
   * (Usado para 'login' no authService)
   * @param login - O email ou username
   * @returns O documento do usuário (COM senha) ou null.
   */
  async findByEmailOrUsernameWithPassword(
    login: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ $or: [{ email: login }, { username: login }] })
      .select('+password +empresa') // Inclui empresa para o payload do token
      .exec();
  }

  /**
   * Encontra um usuário por email OU username dentro de uma empresa específica.
   * (Usado para verificar duplicatas no adminService)
   * @param email
   * @param username
   * @param empresaId
   * @returns O documento do usuário (POJO) ou null.
   */
  async findByEmailOrUsernameInCompany(
    email: string,
    username: string,
    empresaId: string | Types.ObjectId,
  ): Promise<IUser | null> {
    // Correção: .lean() retorna a interface base (IUser)
    return this.userModel
      .findOne({
        empresa: empresaId,
        $or: [{ email }, { username }],
      })
      .lean()
      .exec();
  }

  /**
   * Lista todos os usuários de uma empresa específica.
   * (Usado pelo adminService)
   * @param empresaId
   * @returns Array de documentos de usuário (sem senha).
   */
  async findAllByCompany(
    empresaId: string | Types.ObjectId,
  ): Promise<UserDocument[]> {
    return this.userModel
      .find({ empresa: empresaId })
      .select('username email nome sobrenome role createdAt') // Seleção segura
      .exec();
  }

  /**
   * Cria um novo usuário.
   * (Usado pelo adminService e empresaService)
   * @param userData - Os dados para criar o usuário (sem hash de senha)
   * @param session - (Opcional) Sessão de transação Mongoose
   */
  async create(
    userData: Omit<IUser, 'createdAt' | 'updatedAt' | 'role' | 'status'> &
      Partial<IUser>,
    session?: ClientSession,
  ): Promise<UserDocument> {
    // O create([]) retorna um array de documentos
    const [createdUser] = await this.userModel.create([userData], { session });
    return createdUser;
  }

  /**
   * Atualiza um usuário.
   * (Usado pelo userService para updateProfile)
   * @param id - ID do usuário a atualizar
   * @param updateData - Campos a serem atualizados
   */
  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    updateData: UpdateQuery<IUser>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateData, {
        new: true, // Retorna o documento modificado
        runValidators: true, // Roda os validadores do schema
      })
      .exec();
  }

  /**
   * Atualiza um usuário por um filtro específico.
   * (Usado pelo adminService para updateUserRole)
   * @param filter
   * @param updateData
   */
  async updateOne(
    filter: FilterQuery<UserDocument>,
    updateData: UpdateQuery<IUser>,
  ) {
    return this.userModel.updateOne(filter, updateData).exec();
  }

  /**
   * Deleta um usuário por filtro.
   * (Usado pelo adminService)
   * @param filter
   */
  async deleteOne(filter: FilterQuery<UserDocument>) {
    return this.userModel.deleteOne(filter).exec();
  }
}

/**
 * Instância padrão (singleton) do repositório,
 * injetando o modelo Mongoose principal.
 * Os serviços irão importar esta instância.
 */
export const userRepository = new UserRepository(UserModel);