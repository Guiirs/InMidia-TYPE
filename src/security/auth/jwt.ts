/*
 * Arquivo: src/security/auth/jwt.ts
 * Descrição:
 * Este arquivo centraliza a lógica de assinatura e verificação de JSON Web Tokens (JWT).
 *
 * Alterações:
 * 1. [FIX] Corrigida a tipagem da interface `IJwtSignPayload` para os dados de entrada
 * da função `signJwt`.
 * 2. [FIX] Corrigida a tipagem da interface `IJwtPayload` (payload decodificado)
 * para ser uma interseção de `IJwtSignPayload` e `jwt.JwtPayload`.
 * 3. [FIX] Resolvido o erro TS2322 (No overload matches this call) na função `signJwt`.
 * Usamos `as any` na propriedade `expiresIn`, pois `config.JWT_EXPIRES_IN`
 * é do tipo `string`, mas `@types/jsonwebtoken` espera um tipo "marcado"
 * (ms.StringValue) ou `number`. O valor ("1d") é válido em tempo de execução.
 * 4. [Segurança/Tipagem] A função `verifyJwt` valida que o payload decodificado
 * é um objeto e contém os campos essenciais (id, empresaId).
 */

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '@/config/index';

/**
 * Define a estrutura dos dados que serão *assinados* no payload do JWT.
 */
export interface IJwtSignPayload {
  id: string | Types.ObjectId; // ID do Usuário
  empresaId: string | Types.ObjectId; // ID da Empresa
  role: 'user' | 'admin';
  username: string;
}

/**
 * Define a estrutura do payload *decodificado* (dados + campos JWT).
 * Esta interface é usada para tipar o `req.user`.
 */
export interface IJwtPayload extends IJwtSignPayload, JwtPayload {}

/**
 * Assina um novo token JWT.
 *
 * @param payload - O objeto de payload (dados do usuário) a ser incluído no token.
 * @returns O token JWT assinado como uma string.
 */
export const signJwt = (payload: IJwtSignPayload): string => {
  // Define as opções, incluindo o tempo de expiração
  const options: SignOptions = {
    // [FIX] Usamos 'as any' para contornar o erro de tipagem TS2322.
    // O config.JWT_EXPIRES_IN ('1d') é uma string válida para a biblioteca 'ms',
    // mas o TypeScript não consegue inferir isso.
    expiresIn: config.JWT_EXPIRES_IN as any,
  };

  // A validação do config.JWT_SECRET é garantida pelo config/index.ts no boot
  return jwt.sign(payload, config.JWT_SECRET, options);
};

/**
 * Verifica e decodifica um token JWT.
 *
 * @param token - A string do token JWT a ser verificada.
 * @returns O payload decodificado (IJwtPayload) se o token for válido.
 * @throws Lança um erro (ex: JsonWebTokenError, TokenExpiredError) se o token
 * for inválido, expirado ou malformado.
 */
export const verifyJwt = (token: string): IJwtPayload => {
  // A validação do config.JWT_SECRET é garantida pelo config/index.ts no boot
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Validação de tipo para garantir que o payload é um objeto
    // e não uma string, e que contém os campos esperados.
    if (
      typeof decoded === 'string' ||
      !decoded.id ||
      !decoded.empresaId ||
      !decoded.role
    ) {
      throw new jwt.JsonWebTokenError('Payload do token inválido ou malformado.');
    }

    return decoded as IJwtPayload;
  } catch (err) {
    // O erro será capturado pelo auth.middleware (que o passará para o errorHandler)
    throw err;
  }
};