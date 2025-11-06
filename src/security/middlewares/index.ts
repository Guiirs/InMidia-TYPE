/*
 * Arquivo: src/security/index.ts
 * Descrição:
 * Barrel file para o módulo de Segurança.
 *
 * Alterações (Melhoria de Reutilização #5):
 * 1. [NOVO] Adicionada a exportação da factory `createUploadMiddleware`
 * (vinda de `upload.middleware.ts`) para que possa ser usada
 * em outras partes da aplicação (ex: para upload de PDFs).
 * 2. A exportação de `upload` (instância padrão) foi mantida.
 */

// Middlewares
export { adminMiddleware } from './src/admin.middleware';
export { apiKeyAuthMiddleware } from './src/apiKey.middleware';
export { authMiddleware } from './src/auth.middleware';
export { corsMiddleware } from './src/cors.middleware';
export {
  createRateLimiter,
  loginLimiter,
  generalLimiter,
} from './src/rateLimit.middleware';
export { validate } from './src/validate.middleware';

// [ALTERADO] Exporta tanto a instância padrão 'upload' quanto a nova 'factory'
export {
  upload,
  createUploadMiddleware,
} from './src/upload.middleware';

// Utilitários de Autenticação
export {
  type IJwtSignPayload,
  type IJwtPayload,
  signJwt,
  verifyJwt,
} from '../auth/jwt';
export { hashPassword, comparePassword } from '../auth/password';