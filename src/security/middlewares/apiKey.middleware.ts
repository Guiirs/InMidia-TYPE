import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError'; // (Será criado na Fase 2)
import { empresaRepository } from '@/db/repositories/empresa.repository';
import { comparePassword } from '@/security/auth/password';

/**
 * Middleware para autenticar requisições via API Key (x-api-key).
 *
 * Ele espera uma chave no formato "prefixo_segredo".
 * 1. Busca a empresa pelo "prefixo".
 * 2. Compara o "segredo" com o "api_key_hash" armazenado.
 *
 * (Baseado no apiKeyAuthMiddleware.js original)
 */
export const apiKeyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.info('[ApiKeyAuth] Tentando autenticar API Key...');
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('[ApiKeyAuth] Autenticação falhou: Chave de API ausente.');
    return next(new HttpError(401, 'Chave de API ausente.'));
  }

  // 2. Separa prefixo e segredo (prefix_secret)
  const parts = apiKey.split('_');
  if (parts.length < 2) {
    logger.warn('[ApiKeyAuth] Autenticação falhou: Chave de API mal formatada.');
    return next(new HttpError(403, 'Chave de API mal formatada.'));
  }

  const apiKeySecret = parts.pop(); // A última parte é o segredo
  const apiKeyPrefix = parts.join('_'); // O resto é o prefixo

  if (!apiKeySecret || !apiKeyPrefix) {
    logger.warn('[ApiKeyAuth] Autenticação falhou: Formato de chave inválido.');
    return next(new HttpError(403, 'Chave de API mal formatada.'));
  }

  try {
    // 3. Busca a empresa pelo PREFIXO (usando o repositório)
    // O repositório já seleciona o +api_key_hash
    const empresa = await empresaRepository.findByApiKeyPrefix(apiKeyPrefix);

    if (!empresa || !empresa.api_key_hash) {
      logger.warn(
        `[ApiKeyAuth] Autenticação falhou: Prefixo '${apiKeyPrefix}' não encontrado ou empresa sem hash.`,
      );
      return next(new HttpError(403, 'Chave de API inválida.'));
    }

    // 4. Compara o SEGREDO com o HASH (usando o utilitário de senha)
    const match = await comparePassword(apiKeySecret, empresa.api_key_hash);

    if (!match) {
      logger.warn(
        `[ApiKeyAuth] Autenticação falhou: Segredo incorreto para o prefixo '${apiKeyPrefix}'.`,
      );
      return next(new HttpError(403, 'Chave de API inválida.'));
    }

    // 5. Sucesso! Anexa a empresa ao request (tipado via index.d.ts)
    req.empresa = empresa;

    logger.info(
      `[ApiKeyAuth] Autenticação bem-sucedida para empresa: ${empresa.nome} (ID: ${empresa.id}).`,
    );
    next();
  } catch (err) {
    logger.error(err, '[ApiKeyAuth] ERRO INESPERADO durante a validação da API Key:');
    next(err); // Passa para o errorHandler global
  }
};