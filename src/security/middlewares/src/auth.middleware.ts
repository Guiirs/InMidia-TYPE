/*
 * Arquivo: src/security/middlewares/auth.middleware.ts
 * Descrição:
 * Middleware para autenticar requisições via token JWT (Bearer Token).
 * Ele extrai o token do cabeçalho 'Authorization', o verifica e,
 * se for válido, anexa o payload (req.user) ao objeto Request.
 * (Baseado no authMiddleware.js original)
 *
 * Alterações:
 * 1. [BUG CRÍTICO] Corrigida a ordem dos parâmetros no construtor `HttpError`.
 * A classe espera `new HttpError(message, statusCode)`, mas o código original
 * usava `new HttpError(statusCode, message)`.
 * 2. [Clean Code] Removida a verificação redundante do payload (`!payload.id ...`).
 * A função `verifyJwt` (que corrigimos anteriormente) já garante que o payload
 * é um objeto válido e contém os campos necessários, lançando um erro caso contrário.
 * 3. [Tipagem] Removida a asserção `as IJwtPayload`, pois `verifyJwt` já retorna
 * o tipo correto.
 * 4. [Segurança] Padronizado o código de status para 401 (Não Autorizado) para
 * *todas* as falhas de autenticação (token ausente, malformado, inválido ou
 * expirado), o que é a prática semântica correta.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '@/security/auth/jwt';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';
import { JsonWebTokenError } from 'jsonwebtoken';

/**
 * Middleware para autenticar requisições via token JWT (Bearer Token).
 *
 * Ele extrai o token do cabeçalho 'Authorization', o verifica e,
 * se for válido, anexa o payload (req.user) ao objeto Request.
 *
 * (Baseado no authMiddleware.js original)
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    logger.warn('[AuthMiddleware] Acesso negado: Token não fornecido.');
    // [FIX] Ordem do construtor corrigida: (message, statusCode)
    return next(
      new HttpError('Acesso não autorizado. Token não fornecido.', 401),
    );
  }

  // Extrai o token "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    logger.warn('[AuthMiddleware] Acesso negado: Formato de token inválido.');
    // [FIX] Ordem do construtor corrigida
    return next(new HttpError('Acesso não autorizado. Token malformado.', 401));
  }

  try {
    // 1. Verifica o token. A função 'verifyJwt' já retorna o tipo IJwtPayload
    // e lança um erro (JsonWebTokenError) se o payload for inválido.
    const payload = verifyJwt(token);

    // 2. [REMOVIDO] A verificação 'if (!payload.id ...)' foi removida,
    // pois 'verifyJwt' agora é responsável por essa validação.

    // 3. Anexa o payload ao objeto req (tipado graças ao src/types/index.d.ts)
    req.user = payload;

    logger.debug(
      `[AuthMiddleware] Token validado para user: ${req.user.username} (Empresa: ${req.user.empresaId})`,
    );
    next();
  } catch (err) {
    let message = 'Token inválido ou expirado.';

    // Personaliza a mensagem se for um erro conhecido da biblioteca jwt
    if (err instanceof JsonWebTokenError) {
      message =
        err.name === 'TokenExpiredError' ? 'Token expirado.' : 'Token inválido.';
    }

    logger.warn(`[AuthMiddleware] Verificação do token falhou: ${message}`);
    // [FIX] Ordem do construtor corrigida
    // 401 (Não Autorizado) é o status correto para falhas de autenticação.
    return next(new HttpError(message, 401));
  }
};