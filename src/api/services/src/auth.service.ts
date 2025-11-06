import mongoose from 'mongoose';
import { logger } from '@/config/logger';
import {
  IUserDocument,
  IEmpresaDocument,
  IUser,
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
  signJwt,
} from '@/security/index';
import { LoginDto, RegisterEmpresaDto } from '@/utils/validators/auth.validator';
import { IEmpresa } from '@/db/models/empresa.model';

/**
 * Serviço responsável pela lógica de negócios de autenticação e registo.
 * Utiliza a injeção de dependência para os repositórios (facilitando testes).
 */
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  /**
   * Tenta autenticar um utilizador.
   * (Migração de services/authService.js -> login)
   *
   * @param loginDto - O DTO (Data Transfer Object) contendo email/username e password.
   * @returns Um objeto contendo o token JWT e os dados do utilizador.
   */
  async login(loginDto: LoginDto): Promise<{ token: string; user: IUser }> {
    const { email, password } = loginDto;
    
    // 1. Encontra o utilizador (já inclui a senha e a empresa)
    // Usamos o 'email' do DTO para ambos os campos
    const user = await this.userRepo.findByEmailOrUsernameWithPassword(
      email.toLowerCase(),
    );

    // 2. Verifica se o utilizador existe e se a senha está correta
    if (!user || !user.password) {
      logger.warn(`[AuthService] Tentativa de login falhada (user não encontrado): ${email}`);
      throw new HttpError('Credenciais inválidas.', 401);
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      logger.warn(`[AuthService] Tentativa de login falhada (senha incorreta): ${email}`);
      throw new HttpError('Credenciais inválidas.', 401);
    }

    // 3. Prepara os dados para o token (Payload)
    // O 'user.toJSON()' aplica a transformação _id -> id
    const userJson = user.toJSON();

    const payload = {
      id: userJson.id,
      empresaId: userJson.empresa,
      role: userJson.role,
      username: userJson.username,
    };

    // 4. Gera o token
    const token = signJwt(payload);

    // 5. Retorna o token e os dados do utilizador (sem a senha)
    // O 'userJson' já vem sem a senha devido ao 'select: false' no modelo
    // e ao 'select' explícito no repositório.
    return { token, user: userJson };
  }

  /**
   * Regista uma nova Empresa e o seu primeiro Utilizador Admin.
   * (Migração de services/empresaService.js -> registerEmpresa)
   *
   * @param registerDto - O DTO contendo dados da empresa e do admin.
   * @returns A empresa e o utilizador criados (sem dados sensíveis).
   */
  async registerEmpresa(
    registerDto: RegisterEmpresaDto,
  ): Promise<{ empresa: IEmpresa; user: IUser }> {
    // Inicia uma transação Mongoose
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Criar a Empresa
      const empresaData: Pick<IEmpresa, 'nome' | 'cnpj'> = {
        nome: registerDto.nome_empresa,
        cnpj: registerDto.cnpj,
      };
      const novaEmpresa = await this.empresaRepo.create(empresaData, session);

      // 2. Criar o Utilizador Admin (com senha hasheada)
      const hashedPassword = await hashPassword(registerDto.password);

      const userData: Omit<IUser, 'createdAt' | 'updatedAt'> = {
        username: registerDto.username,
        email: registerDto.email.toLowerCase(),
        password: hashedPassword,
        nome: registerDto.nome,
        sobrenome: registerDto.sobrenome,
        role: 'admin', // O primeiro utilizador é sempre admin
        empresa: novaEmpresa._id,
      };

      const novoUser = await this.userRepo.create(userData, session);

      // 3. Adicionar o utilizador à lista da empresa
      novaEmpresa.usuarios.push(novoUser._id);
      await this.empresaRepo.save(novaEmpresa, session);

      // 4. Cometer a transação
      await session.commitTransaction();

      logger.info(
        `[AuthService] Nova empresa registada: ${novaEmpresa.nome} (ID: ${novaEmpresa.id})`,
      );

      // Retornar os dados (toJSON() remove a senha)
      return {
        empresa: novaEmpresa.toJSON(),
        user: novoUser.toJSON(),
      };
    } catch (error: unknown) {
      // 5. Abortar a transação em caso de erro
      await session.abortTransaction();

      // Trata erros de duplicado (11000)
      if (error instanceof Error && (error as any).code === 11000) {
        const keyValue = (error as any).keyValue;
        const campo = Object.keys(keyValue)[0];
        logger.warn(
          `[AuthService] Falha no registo (Duplicado 11000): ${campo} = ${keyValue[campo]}`,
        );
        throw new HttpError(
          `O ${campo} '${keyValue[campo]}' já está a ser utilizado.`,
          409,
        );
      }
      
      logger.error(error, '[AuthService] Erro ao registar empresa');
      throw new HttpError('Erro interno ao registar a empresa.', 500);
    } finally {
      session.endSession();
    }
  }

  // (Os métodos forgotPassword e resetPassword serão adicionados aqui posteriormente)
}

/**
 * Instância padrão (singleton) do serviço, injetando os repositórios.
 */
export const authService = new AuthService(userRepository, empresaRepository);