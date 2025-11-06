import { createServer } from 'http';
import { createApp } from './app';
import connectDB from '@/db/index';
import { config } from '@/config/index';
import { logger } from '@/config/logger';
import { startCronJobs } from '@/scripts/jobs.runner';
// (Nota: O arquivo original também tratava de erros não tratados do Node)

/**
 * Script de inicialização principal do servidor.
 * (Migração da lógica de server.js)
 */
const startServer = async () => {
  // 1. Carrega as variáveis de ambiente (já feito em config/index.ts)

  // 2. Conecta à Base de Dados (função de db/index.ts)
  await connectDB();

  // 3. Monta a Aplicação Express
  const app = createApp();
  const server = createServer(app);

  // 4. Inicia o Servidor
  server.listen(config.PORT, () => {
    logger.info(
      `Servidor a correr em modo ${config.NODE_ENV} na porta ${config.PORT}`,
    );
    logger.info(
      `Documentação da API disponível em http://localhost:${config.PORT}/api/v1/docs`,
    );

    // 5. Inicia os Cron Jobs (Migração de)
    startCronJobs();
  });

  // 6. Handle de erros não tratados (lógica do JS original)
  process.on('unhandledRejection', (reason: Error | any) => {
    logger.error('UNHANDLED REJECTION! 💥 A desligar...');
    logger.error(reason.name, reason.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

// Executa a inicialização
startServer();