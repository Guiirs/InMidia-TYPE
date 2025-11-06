/*
 * Arquivo: src/security/auth/jwt.ts
 * Descrição:
 * Lógica de assinatura (RS256) e verificação (RS256) de JSON Web Tokens.
 *
 * Alterações (Melhoria de Segurança #2):
 * 1. [Segurança] Migrado de HS256 para RS256 (chaves assimétricas).
 * 2. [signJwt] Usa `config.JWT_PRIVATE_KEY` e `algorithm: 'RS256'`.
 * 3. [verifyJwt] Usa `config.JWT_PUBLIC_KEY` e `algorithms: ['RS256']`.
 * 4. [FIX] Resolvido o erro TS2339 (Property does not exist) na função `verifyJwt`.
 * Substituímos o acesso direto (`!decoded.id`) por verificações
 * de 'type guard' (`!('id' in decoded)`). Isso prova ao TypeScript que as
 * propriedades customizadas existem no objeto 'decoded' antes de retorná-lo
 * como `IJwtPayload`.
 */

import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
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
 * Assina um novo token JWT usando RS256.
 *
 * @param payload - O objeto de payload (dados do usuário) a ser incluído no token.
 * @returns O token JWT assinado como uma string.
 */
export const signJwt = (payload: IJwtSignPayload): string => {
  // Define as opções, incluindo o tempo de expiração e o algoritmo
  const options: SignOptions = {
    // [FIX] Mantém 'as any' para contornar o erro de tipagem TS2322
    expiresIn: config.JWT_EXPIRES_IN as any,
    // [ALTERADO] Define o algoritmo como RS256
    algorithm: 'RS256',
  };

  // [ALTERADO] Usa a CHAVE PRIVADA para assinar
  return jwt.sign(payload, config.JWT_PRIVATE_KEY, options);
};

/**
 * Verifica e decodifica um token JWT usando RS256.
 *
 * @param token - A string do token JWT a ser verificada.
 * @returns O payload decodificado (IJwtPayload) se o token for válido.
 * @throws Lança um erro (ex: JsonWebTokenError, TokenExpiredError) se o token
 * for inválido, expirado ou malformado.
 */
export const verifyJwt = (token: string): IJwtPayload => {
  // [NOVO] Define as opções de verificação, exigindo RS256
  const options: VerifyOptions = {
    algorithms: ['RS256'], // Exige o algoritmo correto
  };

  try {
    // [ALTERADO] Usa a CHAVE PÚBLICA e as opções de verificação
    const decoded = jwt.verify(token, config.JWT_PUBLIC_KEY, options);

    // [FIX - TS2339] Validação de tipo e 'Type Guard'
    // Precisamos verificar se o objeto 'decoded' (que é JwtPayload | Jwt)
    // realmente contém as propriedades customizadas que esperamos.
    if (
      typeof decoded === 'string' || // Verifica se não é uma string
      !('id' in decoded) || // Verifica se a propriedade 'id' existe
      !('empresaId' in decoded) || // Verifica se a propriedade 'empresaId' existe
      !('role' in decoded) // Verifica se a propriedade 'role' existe
    ) {
      throw new jwt.JsonWebTokenError('Payload do token inválido ou malformado.');
    }

    // Agora o TypeScript sabe que 'decoded' tem 'id', 'empresaId' e 'role'
    return decoded as IJwtPayload;
  } catch (err) {
    // O erro será capturado pelo auth.middleware (que o passará para o errorHandler)
    throw err;
  }
};