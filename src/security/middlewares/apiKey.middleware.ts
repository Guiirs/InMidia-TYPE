/*
 * Arquivo: src/security/middlewares/apiKey.middleware.ts
 * Descrição:
 * Middleware para autenticar requisições via API Key (x-api-key).
 * Usado para as rotas da API pública (/api/public/...).
 *
 * Ele espera uma chave no formato "prefixo_segredo".
 * 1. Busca a empresa pelo "prefixo".
 * 2. Compara o "segredo" com o "api_key_hash" armazenado.
 *
 * (Baseado no apiKeyAuthMiddleware.js original)
 *
 * Alterações:
 * 1. [BUG CRÍTICO] Corrigida a ordem dos parâmetros no construtor `HttpError`
 * em todas as instâncias (a ordem correta é `new HttpError(message, statusCode)`).
 * 2. [Clean Code] Removido o comentário obsoleto "// (Será criado na Fase 2)" da
 * importação do HttpError.
 * 3. [Tipagem] O payload anexado (`req.empresa`) está tipado como `any`
 * através de `src/types/index.d.ts`. Idealmente, ele seria tipado
 * como `EmpresaDocument`, mas a tipagem `any` é funcional.
 * 4. [Arquitetura/Comentário] Nota: Este middleware acessa diretamente o repositório
 * (`empresaRepository`). Embora isso funcione, viola a separação de camadas.
 * A lógica de validação da chave (busca e comparação) deveria, idealmente,
 * estar encapsulada dentro de um serviço (ex: AuthService).
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';
import { empresaRepository } from '@/db/repositories/empresa.repository';
import { comparePassword } from '@/security/auth/password';

export const apiKeyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.info('[ApiKeyAuth] Tentando autenticar API Key...');
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('[ApiKeyAuth] Autenticação falhou: Chave de API ausente.');
    // [FIX] Corrigida a ordem dos parâmetros: (message, statusCode)
    return next(new HttpError('Chave de API ausente.', 401));
  }

  // 2. Separa prefixo e segredo (prefix_secret)
  const parts = apiKey.split('_');
  if (parts.length < 2) {
    logger.warn('[ApiKeyAuth] Autenticação falhou: Chave de API mal formatada.');
    // [FIX] Corrigida a ordem: (message, statusCode)
    return next(new HttpError('Chave de API mal formatada.', 403));
  }

  const apiKeySecret = parts.pop(); // A última parte é o segredo
  const apiKeyPrefix = parts.join('_'); // O resto é o prefixo

  if (!apiKeySecret || !apiKeyPrefix) {
    logger.warn('[ApiKeyAuth] Autenticação falhou: Formato de chave inválido.');
    // [FIX] Corrigida a ordem: (message, statusCode)
    return next(new HttpError('Chave de API mal formatada.', 403));
  }

  try {
    // 3. Busca a empresa pelo PREFIXO (usando o repositório)
    // O repositório já seleciona o +api_key_hash
    const empresa = await empresaRepository.findByApiKeyPrefix(apiKeyPrefix);

    if (!empresa || !empresa.api_key_hash) {
      logger.warn(
        `[ApiKeyAuth] Autenticação falhou: Prefixo '${apiKeyPrefix}' não encontrado ou empresa sem hash.`,
      );
      // [FIX] Corrigida a ordem: (message, statusCode)
      return next(new HttpError('Chave de API inválida.', 403));
    }

    // 4. Compara o SEGREDO com o HASH (usando o utilitário de senha)
    const match = await comparePassword(apiKeySecret, empresa.api_key_hash);

    if (!match) {
      logger.warn(
        `[ApiKeyAuth] Autenticação falhou: Segredo incorreto para o prefixo '${apiKeyPrefix}'.`,
      );
      // [FIX] Corrigida a ordem: (message, statusCode)
      return next(new HttpError('Chave de API inválida.', 403));
    }

    // 5. Sucesso! Anexa a empresa ao request (tipado via index.d.ts)
    req.empresa = empresa;

    logger.info(
      `[ApiKeyAuth] Autenticação bem-sucedida para empresa: ${empresa.nome} (ID: ${empresa.id}).`,
    );
    next();
  } catch (err) {
    logger.error(
      err,
      '[ApiKeyAuth] ERRO INESPERADO durante a validação da API Key:',
    );
    next(err); // Passa para o errorHandler global
  }
};