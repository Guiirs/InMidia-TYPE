import { Request, Response, NextFunction } from 'express';
import { verifyJwt, IJwtPayload } from '@/security/auth/jwt';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

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
    return next(
      new HttpError(401, 'Acesso não autorizado. Token não fornecido.'),
    );
  }

  // Extrai o token "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    logger.warn('[AuthMiddleware] Acesso negado: Formato de token inválido.');
    return next(new HttpError(401, 'Acesso não autorizado. Token malformado.'));
  }

  try {
    // Verifica o token
    const payload = verifyJwt(token) as IJwtPayload;

    // Validação crucial do payload (replicando a lógica do JS)
    if (!payload.id || !payload.empresaId || !payload.role) {
      logger.error(
        `[AuthMiddleware] Payload do token incompleto para utilizador ID: ${payload.id}.`,
      );
      return next(new HttpError(403, 'Token inválido (payload incompleto).'));
    }

    // Anexa o payload ao objeto req (tipado graças ao src/types/index.d.ts)
    req.user = payload;

    logger.debug(
      `[AuthMiddleware] Token validado para user: ${req.user.username} (Empresa: ${req.user.empresaId})`,
    );
    next();
  } catch (err) {
    let message = 'Token inválido ou expirado.';
    if (err instanceof Error) {
      message = err.name === 'TokenExpiredError' ? 'Token expirado.' : message;
    }

    logger.warn(`[AuthMiddleware] Verificação do token falhou: ${message}`);
    // Usamos 401 (Não Autorizado) em vez de 403 (Proibido) para tokens inválidos/expirados
    return next(new HttpError(401, message));
  }
};