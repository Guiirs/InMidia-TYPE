import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '@/config/index';

/**
 * Define a estrutura do payload que será armazenado dentro do JWT.
 * (Baseado na lógica de generateToken em authService.js)
 */
export interface IJwtPayload {
  id: string | Types.ObjectId; // ID do Usuário
  empresaId: string | Types.ObjectId; // ID da Empresa
  role: 'user' | 'admin';
  username: string;
}

/**
 * Assina um novo token JWT.
 *
 * @param payload - O objeto de payload (dados do usuário) a ser incluído no token.
 * @returns O token JWT assinado como uma string.
 * @throws Lança um erro se a chave secreta (JWT_SECRET) não estiver definida.
 */
export const signJwt = (payload: IJwtPayload): string => {
  if (!config.JWT_SECRET) {
    // Esta verificação é um fallback, config/index.ts já deve ter validado
    throw new Error('JWT_SECRET não está definida nas variáveis de ambiente.');
  }

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
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
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET não está definida nas variáveis de ambiente.');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    return decoded as IJwtPayload;
  } catch (err) {
    // O erro será capturado pelo errorHandler global ou pelo middleware de autenticação
    throw err;
  }
};