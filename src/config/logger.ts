import pino, { LoggerOptions, TransportTargetOptions } from 'pino';
import { config } from './index';
import path from 'path';
import fs from 'fs';

// Garante que o diretório de logs exista (baseado no logger.js original)
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const transportTargets: TransportTargetOptions[] = [];

if (config.isProduction) {
  // 1. Log JSON padrão para STDOUT (para Datadog, Splunk, etc.)
  transportTargets.push({
    level: 'info',
    target: 'pino/file',
    options: { destination: 1 }, // 1 = stdout
  });
  
  // 2. Log de todos os níveis para 'logs/all.log'
  transportTargets.push({
    level: 'debug',
    target: 'pino/file',
    options: { destination: path.join(logDir, 'all.log'), mkdir: true },
  });

  // 3. Log de erros para 'logs/error.log'
  transportTargets.push({
    level: 'error',
    target: 'pino/file',
    options: { destination: path.join(logDir, 'error.log'), mkdir: true },
  });
} else {
  // Apenas logs legíveis no console em desenvolvimento
  transportTargets.push({
    level: 'debug',
    target: 'pino-pretty', // Usa pino-pretty
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  });
}

// Configuração do Logger
const loggerOptions: LoggerOptions = {
  level: config.isProduction ? 'info' : 'debug',
  // Define o fuso horário (opcional, mas bom para consistência)
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
};

// Cria o logger com os transportes adequados
export const logger = pino(
  loggerOptions,
  pino.transport({
    targets: transportTargets,
  }),
);

// Adiciona um stream compatível com Morgan/Express (baseado no logger.js original)
// Pino recomenda usar 'pino-http', mas isso mantém a compatibilidade com o morgan
export const loggerStream = {
  write: (message: string) => {
    // Pino usa o nível 'http' (nível 35), que é acima de 'info' (30)
    // Usamos 'info' se 'http' não estiver definido, ou apenas 'info'.
    logger.info(message.trim());
  },
};