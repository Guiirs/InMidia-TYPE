/*
 * Arquivo: src/security/middlewares/rateLimit.middleware.ts
 * Descrição:
 * Define os middlewares de limitação de taxa (rate limiting) para proteger
 * a API contra ataques de força bruta ou abuso.
 * (Baseado na lógica de routes/auth.js e nas melhores práticas)
 *
 * Alterações:
 * 1. [Clean Code] O arquivo original já estava bem estruturado.
 * 2. [Tipagem] A tipagem inferida pela biblioteca `express-rate-limit`
 * para os parâmetros do `handler` (req, res, next, options) é robusta
 * e foi mantida.
 * 3. [Boas Práticas] O uso de `standardHeaders: 'draft-7'` e
 * `legacyHeaders: false` está correto e alinhado com os padrões modernos da IETF.
 * 4. [Boas Práticas] O `handler` de log customizado é uma excelente prática
 * para monitorizar tentativas de abuso da API.
 */

import { rateLimit } from 'express-rate-limit';
//import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

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