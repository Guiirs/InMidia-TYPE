import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

/**
 * Middleware para autorização de Administradores.
 *
 * Este middleware DEVE ser executado *após* o 'authMiddleware',
 * pois depende de 'req.user' estar preenchido.
 *
 * Ele verifica se req.user.role é 'admin'.
 *
 * (Baseado no adminAuthMiddleware.js original)
 */
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.debug('[AdminMiddleware] Verificando permissão de administrador...');

  // 1. Verifica se req.user foi definido pelo middleware anterior
  if (!req.user) {
    logger.warn(
      '[AdminMiddleware] Acesso negado: req.user ausente (authMiddleware não executado ou falhou?).',
    );
    // Erro 401 (Não Autorizado) pois a autenticação falhou
    return next(new HttpError(401, 'Acesso não autorizado.'));
  }

  const { role, id } = req.user;

  // 2. Verifica a role
  if (role === 'admin') {
    logger.debug(`[AdminMiddleware] Admin ${id} autenticado. Acesso permitido.`);
    next(); // Permite o acesso
  } else {
    // Erro 403 (Proibido) pois o utilizador está autenticado, mas não tem permissão
    logger.warn(
      `[AdminMiddleware] Utilizador ${id} (Role: ${role}) tentou aceder a rota restrita. Acesso negado.`,
    );
    return next(
      new HttpError(
        403,
        'Acesso negado. Apenas administradores podem realizar esta ação.',
      ),
    );
  }
};