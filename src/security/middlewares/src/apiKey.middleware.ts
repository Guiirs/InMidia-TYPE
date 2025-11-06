/*
 * Arquivo: src/security/middlewares/apiKey.middleware.ts
 * Descrição:
 * Middleware para autenticar requisições via API Key (x-api-key).
 *
 * Alterações (Melhoria de Arquitetura):
 * 1. [Desacoplamento] A lógica de validação (busca no DB e comparação de hash)
 * foi removida deste arquivo e movida para o `AuthService`.
 * 2. [Clean Code] O middleware agora apenas extrai o token e chama
 * `authService.validateApiKey(apiKey)`.
 * 3. [Error Handling] O middleware agora usa um `try...catch` para
 * capturar erros lançados pelo `AuthService` (ex: HttpError 401, 403)
 * e passá-los para o `errorHandler` global (via `next(err)`).
 * 4. Removidas importações não utilizadas de `empresaRepository` e `comparePassword`.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';
// [NOVO] Importa o serviço de autenticação
import { authService } from '@/api/services/src/auth.service';
// [REMOVIDO] import { empresaRepository } from '@/db/repositories/empresa.repository';
// [REMOVIDO] import { comparePassword } from '@/security/auth/password';

export const apiKeyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.info('[ApiKeyAuth] Tentando autenticar API Key...');
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('[ApiKeyAuth] Autenticação falhou: Chave de API ausente.');
    return next(new HttpError('Chave de API ausente.', 401));
  }

  try {
    // 1. Delega a validação completa para o AuthService
    const empresa = await authService.validateApiKey(apiKey);

    // 2. Sucesso! Anexa a empresa ao request (tipado via index.d.ts)
    // A 'empresa' retornada pelo serviço já é um POJO seguro (.toJSON())
    req.empresa = empresa;

    next();
  } catch (err) {
    // 3. Captura qualquer erro lançado pelo AuthService (ex: 403, 404, 500)
    // e passa para o errorHandler global.
    logger.warn(
      `[ApiKeyAuth] Falha na validação da API Key: ${(err as Error).message}`,
    );
    next(err);
  }
};