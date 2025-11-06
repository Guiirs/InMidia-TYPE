/*
 * Arquivo: src/security/index.ts
 * Descrição:
 * Barrel file para o módulo de Segurança.
 * Exporta todos os middlewares e utilitários relacionados
 * à autenticação, autorização e segurança da API.
 *
 * Alterações:
 * 1. [Clean Code] O arquivo original já estava correto e funcional.
 * 2. Nenhuma correção de tipagem foi necessária.
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
export { upload } from './middlewares/upload.middleware'; // Adicionando o upload

// Utilitários de Autenticação
export {
  type IJwtSignPayload, // Exporta o tipo para assinatura
  type IJwtPayload, // Exporta o tipo para req.user
  signJwt,
  verifyJwt,
} from './auth/jwt';
export { hashPassword, comparePassword } from './auth/password';