import cors, { CorsOptions } from 'cors';
import { config } from '@/config/index';
import { logger } from '@/config/logger';

// Lista de origens permitidas
const allowedOrigins: string[] = [];

if (config.FRONTEND_URL) {
  allowedOrigins.push(config.FRONTEND_URL);
}

// Em desenvolvimento, podemos permitir o Postman ou outras ferramentas locais
if (config.isDevelopment) {
  // Nota: Adicione aqui outros localhost se o seu frontend rodar em portas diferentes
  // allowedOrigins.push('http://localhost:3000'); // Exemplo
}

const corsOptions: CorsOptions = {
  /**
   * Função 'origin' que valida a origem da requisição.
   * (Replicando a lógica do server.js original, mas de forma mais robusta)
   */
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: Postman, curl, apps mobile)
    // OU requisições da lista de permitidos.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`[CORS] Requisição bloqueada. Origem: ${origin}`);
      callback(
        new Error(
          'Esta origem não é permitida pela política de CORS da aplicação.',
        ),
      );
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // Cabeçalhos permitidos
  credentials: true, // Permite o envio de cookies (embora não estejamos usando sessions)
};

logger.info(
  `[CORS] Configurado para permitir origens: ${allowedOrigins.join(', ')}`,
);

export const corsMiddleware = cors(corsOptions);