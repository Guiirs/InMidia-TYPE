/*
 * Arquivo: src/server.ts
 * Descrição:
 * Script de inicialização principal do servidor.
 *
 * Alterações (Melhoria de Robustez):
 * 1. [Robustez] Adicionado um handler global para `uncaughtException` no topo
 * do ficheiro. Isto garante que erros síncronos não tratados (bugs)
 * sejam logados antes de a aplicação falhar, evitando um "silent crash".
 * 2. [Robustez] Adicionado um handler para `SIGTERM`. Este sinal é enviado por
 * plataformas de orquestração (como Docker, Kubernetes, PM2) para
 * solicitar que a aplicação termine. Agora, o servidor fechará
 * graciosamente (graceful shutdown).
 * 3. [Robustez] O handler `unhandledRejection` (para promessas não tratadas)
 * foi mantido, pois ele depende da variável `server` para também
 * executar um graceful shutdown.
 * 4. [Tipagem] Adicionada a tipagem explícita `http.Server` à variável `server`.
 * 5. [Lógica] Adicionada uma verificação para não iniciar os `startCronJobs`
 * se `config.isTest` for verdadeiro, evitando que tarefas agendadas
 * executem durante os testes.
 */

// [ALTERADO] Importado 'Server' para tipagem
import { createServer, Server } from 'http';
import { createApp } from './app';
import connectDB from '@/db/index';
import { config } from '@/config/index';
import { logger } from '@/config/logger';
import { startCronJobs } from '@/scripts/jobs.runner';

// [NOVO] Handler para erros síncronos não apanhados (ex: bugs de programação)
// Deve estar no topo para apanhar erros de inicialização.
process.on('uncaughtException', (err: Error) => {
  logger.fatal(err, 'UNCAUGHT EXCEPTION! 💥 A desligar...');
  // Sair imediatamente é crucial aqui, pois o estado da aplicação
  // é desconhecido e possivelmente corrupto.
  process.exit(1);
});

/**
 * Script de inicialização principal do servidor.
 */
const startServer = async () => {
  // 1. Carrega as variáveis de ambiente (já feito em config/index.ts)

  // 2. Conecta à Base de Dados (função de db/index.ts)
  await connectDB();

  // 3. Monta a Aplicação Express
  const app = createApp();
  // [TIPAGEM] Adicionado tipo Server
  const server: Server = createServer(app);

  // 4. Handle de erros não tratados (lógica do JS original)
  // (Mantido aqui, pois depende da variável 'server' para fechar)
  process.on('unhandledRejection', (reason: Error | any) => {
    logger.fatal(
      reason,
      'UNHANDLED REJECTION! 💥 A desligar graciosamente...',
    );
    // Tenta um graceful shutdown
    server.close(() => {
      logger.info('Servidor HTTP fechado.');
      process.exit(1); // Sai com erro
    });
  });

  // [NOVO] Handler para 'SIGTERM' (Sinal de término da plataforma)
  process.on('SIGTERM', () => {
    logger.info('SINAL SIGTERM recebido. A desligar graciosamente...');
    server.close(() => {
      logger.info('Servidor HTTP fechado. Processo a terminar.');
      process.exit(0); // 0 indica sucesso no desligamento
    });
  });

  // 5. Inicia o Servidor
  server.listen(config.PORT, () => {
    logger.info(
      `Servidor a correr em modo ${config.NODE_ENV} na porta ${config.PORT}`,
    );
    
    // Apenas mostrar a rota do Swagger se não estivermos em produção
    if (!config.isProduction) {
      logger.info(
        `Documentação da API (desativada no app.ts) estaria em http://localhost:${config.PORT}/api/v1/docs`,
      );
    }

    // 6. Inicia os Cron Jobs (Migração de)
    // [ALTERADO] Não iniciar cron jobs em ambiente de teste
    if (!config.isTest) {
      startCronJobs();
    } else {
      logger.warn('[Server] Cron jobs desativados em ambiente de TESTE.');
    }
  });
};

// Executa a inicialização
startServer();