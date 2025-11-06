/**
 * Barrel file para o módulo de Segurança.
 * Exporta todos os middlewares e utilitários relacionados
 * à autenticação, autorização e segurança da API.
 */

// Middlewares
export { adminMiddleware } from './middlewares/admin.middleware';
export { apiKeyAuthMiddleware } from './middlewares/apiKey.middleware';
export { authMiddleware } from './middlewares/auth.middleware';
export { corsMiddleware } from './middlewares/cors.middleware';
export {
  createRateLimiter,
  loginLimiter,
  generalLimiter,
} from './middlewares/rateLimit.middleware';
export { validate } from './middlewares/validate.middleware';

// Utilitários de Autenticação
export { type IJwtPayload, signJwt, verifyJwt } from './auth/jwt';
export { hashPassword, comparePassword } from './auth/password';