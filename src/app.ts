import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
//import swaggerUi from 'swagger-ui-express';

import { logger, loggerStream } from '@/config/logger';
import { corsMiddleware } from '@/security/middlewares/cors.middleware';
import { errorHandler } from '@/utils/errors/errorHandler';
import { HttpError } from '@/utils/errors/httpError';
import { apiRouter } from '@/api/routes/index';
//import swaggerConfig from '../swaggerConfig'; // O ficheiro JS deve ser migrado para TS/JSON

/**
 * Configura e monta a aplicação Express.
 * (Migração da lógica de montagem do server.js)
 */
export const createApp = (): Application => {
  const app = express();

  // --- Middlewares Essenciais ---

  // Segurança HTTP Headers
  app.use(helmet()); 

  // CORS (Lógica migrada para middleware/cors.middleware.ts)
  app.use(corsMiddleware); //

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

  // Rota da Documentação API (Swagger)
  //app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerConfig));

  // --- Rotas da API (Routes Aggregator) ---
  // O apiRouter em routes/index.ts cuida de mapear /empresas, /public e /v1/...
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