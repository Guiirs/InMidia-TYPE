import cron from 'node-cron';
import { logger } from '@/config/logger';

// Importa os serviços que contêm a lógica de atualização (Fase 2)
import { placaService } from '@/api/services/src/placa.service';
import { piService } from '@/api/services/src/pi.service';

/**
 * Agendador principal para iniciar todos os Cron Jobs.
 * (Migração da lógica de agendamento do server.js e updateStatusJob.js)
 */
export const startCronJobs = (): void => {
  logger.info('[CRON] Tentando iniciar tarefas agendadas...');

  // --- 1. Job Diário: Atualizar Status das Placas e PIs ---
  // A cada dia, à meia-noite (00:00)
  // Expressão cron: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON JOB] Executando tarefas diárias de atualização de status...');
    
    // A. Atualiza PIs Vencidas (Lógica de services/piService.js/updateVencidas)
    try {
      await piService.updateVencidas();
    } catch (err) {
      logger.error(err, '[CRON ERROR] Falha ao atualizar status das PIs vencidas.');
    }

    // B. Atualiza Status das Placas (Lógica de scripts/updateStatusJob.js)
    // Este método irá verificar aluguéis ativos e alternar o status 'disponivel'.
    try {
      await placaService.runStatusUpdateJob(); // Assumindo este método no PlacaService
    } catch (err) {
      logger.error(err, '[CRON ERROR] Falha ao atualizar status das Placas (Aluguéis).');
    }
  });

  // --- 2. Job Semanal: Backup do Banco de Dados ---
  // A cada domingo, às 02:00
  // Expressão cron: '0 2 * * 0'
  cron.schedule('0 2 * * 0', async () => {
    logger.info('[CRON JOB] Executando tarefa semanal de backup do MongoDB...');
    // TODO: Implementar a lógica de backup para R2 (que usará storage.service.ts)
    // try {
    //   await backupService.performBackup();
    // } catch (err) {
    //   logger.error(err, '[CRON ERROR] Falha ao executar o backup do DB.');
    // }
  });

  logger.info('[CRON] Tarefas agendadas iniciadas com sucesso.');
};