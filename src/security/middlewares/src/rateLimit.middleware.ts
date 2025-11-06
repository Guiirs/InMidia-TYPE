/*
 * Arquivo: src/security/middlewares/rateLimit.middleware.ts
 * Descrição:
 * Define os middlewares de limitação de taxa (rate limiting).
 *
 * Alterações (Melhoria de Escalabilidade #4):
 * 1. [NOVO] Importado `MongoStore` da biblioteca `rate-limit-mongo`.
 * 2. [NOVO] Importado o objeto `config` para aceder à MONGODB_URI.
 * 3. [ALTERADO] A função `createRateLimiter` agora inclui a opção `store`.
 * 4. [Escalabilidade] O middleware agora usa o MongoDB como um store
 * persistente e partilhado. Isto garante que o rate limit funcione
 * corretamente mesmo num ambiente com balanceamento de carga (cluster)
 * com múltiplas instâncias do servidor.
 */

import { rateLimit } from 'express-rate-limit';
//import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { config } from '@/config/index'; // [NOVO] Importa a configuração
import MongoStore from 'rate-limit-mongo';
/**
 * Cria uma instância de middleware de rate limiting com configurações personalizadas.
 *
 * @param windowMs - A janela de tempo em milissegundos (ex: 15 * 60 * 1000 para 15 minutos).
 * @param max - O número máximo de requisições permitidas nessa janela.
 * @param message - A mensagem de erro a ser enviada.
 * @returns Uma instância do middleware rate-limit.
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
) => {
  return rateLimit({
    // [NOVO] Configura o store persistente no MongoDB
    store: new MongoStore({
      uri: config.MONGODB_URI,
      // Pode adicionar outras opções, ex: collectionName: 'rate-limit-logs'
      // Por agora, usamos o padrão.
    }),

    windowMs,
    max,
    message: { message }, // Padroniza a resposta de erro
    headers: true, // Envia cabeçalhos 'RateLimit-*'
    standardHeaders: 'draft-7', // Usa o padrão IETF
    legacyHeaders: false,

    /**
     * Handler customizado para logar quando um limite é atingido.
     * (Baseado no handler do routes/auth.js original)
     */
    handler: (req, res, next, options) => {
      // Tenta obter o IP real, mesmo atrás de um proxy (ex: NGINX, Cloudflare)
      const ip =
        req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.socket?.remoteAddress ||
        req.ip;

      logger.warn(
        `[RateLimit] Limite de taxa atingido para IP: ${ip}. Rota: ${req.originalUrl}. Mensagem: ${options.message.message}`,
      );

      res.status(options.statusCode).send(options.message);
    },
  });
};

/**
 * Limitador de login padrão.
 * (Baseado na configuração do routes/auth.js original: 10 requisições / 15 minutos)
 */
export const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  10,
  'Muitas tentativas de login a partir deste IP, por favor tente novamente após 15 minutos.',
);

/**
 * Limitador geral de API (mais flexível).
 */
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  100, // 100 requisições
  'Muitas requisições. Tente novamente mais tarde.',
);