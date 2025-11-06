/*
 * Arquivo: src/security/middlewares/cors.middleware.ts
 * Descrição:
 * Configura o middleware de Cross-Origin Resource Sharing (CORS) para a aplicação.
 * Define quais origens, métodos e cabeçalhos são permitidos.
 *
 * Alterações:
 * 1. [Tipagem] Corrigida a tipagem da função de callback 'origin'. O parâmetro
 * 'origin' pode ser `undefined`, e o callback espera `(Error | null, boolean?)`.
 * 2. [Clean Code] Melhorada a mensagem de log final para lidar com o caso de
 * nenhuma origem ser explicitamente permitida (lista vazia), tornando o log
 * mais preciso.
 * 3. [Segurança/Comentário] Adicionado um comentário de segurança explícito
 * sobre a implicação de `!origin` (permitir requisições sem um cabeçalho
 * 'Origin'), conforme a lógica original.
 */

import cors, { CorsOptions } from 'cors';
import { config } from '@/config/index';
import { logger } from '@/config/logger';

// Lista de origens permitidas
const allowedOrigins: string[] = [];

// Adiciona a URL principal do frontend, se definida no .env
if (config.FRONTEND_URL) {
  allowedOrigins.push(config.FRONTEND_URL);
}

// Em desenvolvimento, podemos permitir o Postman ou outras ferramentas locais
if (config.isDevelopment) {
  // Nota: Adicione aqui outros localhost se o seu frontend rodar em portas diferentes
  // Ex: allowedOrigins.push('http://localhost:3000');
}

const corsOptions: CorsOptions = {
  /**
   * Função 'origin' que valida a origem da requisição.
   * (Replicando a lógica do server.js original, mas de forma mais robusta)
   */
  origin: (
    origin: string | undefined,
    // [FIX] Tipagem correta do callback de 'cors'
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    /*
     * [Segurança] A condição `!origin` permite requisições que não possuem
     * o cabeçalho 'Origin' (ex: Postman, curl, apps mobile).
     * Se esta API for *exclusivamente* para navegadores, esta condição
     * deve ser removida para prevenir certos tipos de ataques CSRF.
     * Mantemos a lógica original que parecia permitir testes via ferramentas REST.
     */
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

// [FIX] Log aprimorado para ser mais claro se a lista estiver vazia
const allowedLog =
  allowedOrigins.length > 0
    ? allowedOrigins.join(', ')
    : 'Nenhuma (permitindo apenas requisições sem cabeçalho origin)';

logger.info(`[CORS] Configurado para permitir origens: ${allowedLog}`);

export const corsMiddleware = cors(corsOptions);