/*
 * Arquivo: src/app.ts
 * Descrição:
 * Ponto de entrada da configuração da aplicação Express.
 *
 * Alterações (Melhoria de Segurança):
 * 1. [Segurança] Importado o `generalLimiter` (limitador de taxa geral)
 * do módulo de segurança.
 * 2. [Segurança] Aplicado o `generalLimiter` globalmente a todas as rotas
 * que começam com `/api`. Isto protege a API contra abuso (ex: 100
 * requisições por 15 minutos por IP), complementando o limitador
 * mais restrito que já existe na rota de login.
 * 3. [Clean Code] Removidos os comentários do Swagger/swaggerConfig,
 * pois estavam desativados no código original.
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
// [NOVO] Importa o limitador de taxa global
import { generalLimiter } from '@/security/middlewares/src/rateLimit.middleware';
import { loggerStream } from '@/config/logger';
import { corsMiddleware } from '@/security/middlewares/src/cors.middleware';
import { errorHandler } from '@/utils/errors/errorHandler';
import { HttpError } from '@/utils/errors/httpError';
import { apiRouter } from '@/api/routes/index';

/**
 * Configura e monta a aplicação Express.
 */
export const createApp = (): Application => {
  const app = express();

  // --- Middlewares Essenciais ---

  // Segurança HTTP Headers
  app.use(helmet());

  // CORS
  app.use(corsMiddleware);

  // Logging de requisições HTTP (usa o logger stream customizado)
  app.use(morgan('combined', { stream: loggerStream }));

  // Parser de Body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve ficheiros estáticos (ex: logos para PDF)
  app.use(express.static('public'));

  // --- Rotas de Utilidade ---

  // Rota de Status (Health Check)
  app.get('/api/v1/status', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
  });

  // Rota da Documentação API (Swagger) - (Mantida desativada)
  // app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerConfig));

  // --- Rotas da API (Routes Aggregator) ---

  // [NOVO] Aplica o Rate Limit global a todas as rotas da API
  app.use('/api', generalLimiter);

  // Regista o router principal
  app.use('/api', apiRouter);

  // --- Middlewares de Erro ---

  // Handler para rotas 404 (Não Encontrado)
  app.use((req, res, next) => {
    next(
      new HttpError(
        `Não Encontrado: A rota ${req.originalUrl} não existe na API.`,
        404,
      ),
    );
  });

  // Handler de Erro Global (deve ser o último middleware)
  app.use(errorHandler);

  return app;
};