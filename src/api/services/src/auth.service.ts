/*
 * Arquivo: src/api/services/src/auth.service.ts
 * Descrição:
 * Serviço responsável pela lógica de negócios de autenticação e registo.
 *
 * Alterações (Melhoria de Arquitetura):
 * 1. [NOVO] Adicionadas importações de `IEmpresa` e `comparePassword`.
 * 2. [NOVO] Adicionado o método `validateApiKey(apiKey: string)`.
 * Esta lógica foi movida do `apiKey.middleware.ts` para este serviço,
 * desacoplando o middleware da camada de dados (repositório) e
 * centralizando a lógica de autenticação.
 */

import mongoose from 'mongoose';
import { logger } from '@/config/logger';
import { IUserDocument, IEmpresaDocument, IUser } from '@/db/models/user.model';
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
  comparePassword, // [NOVO] Importado para validação da API Key
  hashPassword,
  signJwt,
} from '@/security/middlewares/src/index';
import { LoginDto, RegisterEmpresaDto } from '@/utils/validators/auth.validator';
import { IEmpresa } from '@/db/models/empresa.model'; // [NOVO] Importado para o tipo de retorno

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
   */
  async login(loginDto: LoginDto): Promise<{ token: string; user: IUser }> {
    const { email, password } = loginDto;

    // 1. Encontra o utilizador (já inclui a senha e a empresa)
    const user = await this.userRepo.findByEmailOrUsernameWithPassword(
      email.toLowerCase(),
    );

    // 2. Verifica se o utilizador existe e se a senha está correta
    if (!user || !user.password) {
      logger.warn(
        `[AuthService] Tentativa de login falhada (user não encontrado): ${email}`,
      );
      throw new HttpError('Credenciais inválidas.', 401);
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      logger.warn(
        `[AuthService] Tentativa de login falhada (senha incorreta): ${email}`,
      );
      throw new HttpError('Credenciais inválidas.', 401);
    }

    // 3. Prepara os dados para o token (Payload)
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
    return { token, user: userJson };
  }

  /**
   * Regista uma nova Empresa e o seu primeiro Utilizador Admin.
   * (Migração de services/empresaService.js -> registerEmpresa)
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
      // (Nota: O modelo JS original tinha 'usuarios', o TS tem 'usuarios')
      // (O modelo TS de Empresa precisa ter o campo 'usuarios: [Types.ObjectId]')
      if (novaEmpresa.usuarios) {
        novaEmpresa.usuarios.push(novoUser._id);
        await this.empresaRepo.save(novaEmpresa, session);
      } else {
        logger.warn(
          `[AuthService] Modelo Empresa (ID: ${novaEmpresa.id}) não possui o campo 'usuarios' inicializado.`,
        );
      }

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

  /**
   * [NOVO] Valida uma API Key (prefixo_segredo)
   * Lógica movida do apiKey.middleware para o AuthService para desacoplamento.
   *
   * @param apiKey - A chave completa (prefix_secret) vinda do header.
   * @returns O documento da empresa (JSON) se a chave for válida.
   * @throws {HttpError} Se a chave for malformada, inválida ou não corresponder.
   */
  async validateApiKey(apiKey: string): Promise<IEmpresa> {
    // 1. Separa prefixo e segredo (prefix_secret)
    const parts = apiKey.split('_');
    if (parts.length < 2) {
      logger.warn('[AuthService-APIKey] Validação falhou: Chave mal formatada.');
      throw new HttpError('Chave de API mal formatada.', 403);
    }

    const apiKeySecret = parts.pop(); // A última parte é o segredo
    const apiKeyPrefix = parts.join('_'); // O resto é o prefixo

    if (!apiKeySecret || !apiKeyPrefix) {
      logger.warn('[AuthService-APIKey] Validação falhou: Formato de chave inválido.');
      throw new HttpError('Chave de API mal formatada.', 403);
    }

    // 2. Busca a empresa pelo PREFIXO (usando o repositório)
    const empresa = await this.empresaRepo.findByApiKeyPrefix(apiKeyPrefix);

    if (!empresa || !empresa.api_key_hash) {
      logger.warn(
        `[AuthService-APIKey] Validação falhou: Prefixo '${apiKeyPrefix}' não encontrado ou empresa sem hash.`,
      );
      throw new HttpError('Chave de API inválida.', 403);
    }

    // 3. Compara o SEGREDO com o HASH
    const match = await comparePassword(apiKeySecret, empresa.api_key_hash);

    if (!match) {
      logger.warn(
        `[AuthService-APIKey] Validação falhou: Segredo incorreto para o prefixo '${apiKeyPrefix}'.`,
      );
      throw new HttpError('Chave de API inválida.', 403);
    }

    // 4. Sucesso! Retorna os dados da empresa (sem campos sensíveis)
    logger.info(
      `[AuthService-APIKey] API Key validada com sucesso para empresa: ${empresa.nome} (ID: ${empresa.id}).`,
    );
    return empresa.toJSON();
  }

  // (Os métodos forgotPassword e resetPassword serão adicionados aqui posteriormente)
}

/**
 * Instância padrão (singleton) do serviço, injetando os repositórios.
 */
export const authService = new AuthService(userRepository, empresaRepository);