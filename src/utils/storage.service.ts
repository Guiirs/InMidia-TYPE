import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import { config } from '@/config/index';
import { logger } from '@/config/logger';
import { HttpError } from './errors/httpError';

/**
 * Lógica de Failsafe (se o R2/S3 não estiver configurado)
 * (Baseado no uploadMiddleware.js original)
 */
let s3Client: S3Client | null = null;
let isR2ConfigComplete = false;

if (
  config.R2_ENDPOINT &&
  config.R2_ACCESS_KEY_ID &&
  config.R2_SECRET_ACCESS_KEY &&
  config.RS_BUCKET_NAME
) {
  isR2ConfigComplete = true;
  s3Client = new S3Client({
    endpoint: config.R2_ENDPOINT,
    region: 'auto', // R2 requer 'auto'
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });
  logger.info('[StorageService] Cliente S3/R2 configurado com sucesso.');
} else {
  logger.warn(
    '[StorageService] Variáveis de ambiente R2/S3 incompletas. O serviço de storage não funcionará.',
  );
}

/**
 * Gera a Key completa (caminho) do arquivo no R2/S3.
 * @param filename - O nome do arquivo (ex: 'imagem.jpg' ou 'backup.gz')
 * @param type - O tipo de upload (pasta)
 */
const getFileKey = (
  filename: string,
  type: 'placa' | 'cliente_logo' | 'backup',
): string => {
  const baseFolder = config.R2_FOLDER_NAME; // 'inmidia-uploads-sistema'

  switch (type) {
    case 'backup':
      // (Baseado no backupJob.js)
      return `inmidia-db-backups/${filename}`;
    case 'cliente_logo':
      // (Baseado no clienteService.js)
      return `${baseFolder}/${filename}`;
    case 'placa':
    default:
      // (Baseado no placaService.js)
      return `${baseFolder}/${filename}`;
  }
};

/**
 * Apaga um ficheiro do bucket R2/S3.
 * (Migração de deleteFileFromR2 em uploadMiddleware.js)
 *
 * @param filename - O nome do *arquivo* (ex: imagem-123.png)
 * @param type - O tipo (para encontrar a pasta correta)
 */
const deleteFileFromR2 = async (
  filename: string,
  type: 'placa' | 'cliente_logo',
) => {
  if (!s3Client || !isR2ConfigComplete) {
    logger.error(
      '[StorageService] Tentativa de apagar ficheiro falhou: Cliente R2 não configurado.',
    );
    throw new HttpError('Serviço de armazenamento (R2) não inicializado.', 500);
  }
  if (!filename) {
    logger.warn('[StorageService] Tentativa de apagar ficheiro com nome vazio.');
    return;
  }

  const fileKey = getFileKey(filename, type);

  const command = new DeleteObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: fileKey,
  });

  try {
    logger.info(`[StorageService] Tentando apagar ficheiro do R2: ${fileKey}`);
    await s3Client.send(command);
    logger.info(`[StorageService] Ficheiro ${fileKey} apagado com sucesso do R2.`);
  } catch (error) {
    logger.error(
      error,
      `[StorageService] Erro ao apagar ficheiro ${fileKey} do R2:`,
    );
    // Não lançamos erro fatal, pois a falha em apagar um arquivo antigo
    // não deve travar a atualização da placa (lógica do JS original).
  }
};

/**
 * Faz upload de um arquivo local (stream ou path) para o R2/S3.
 * (Migração de uploadFileToR2 em uploadMiddleware.js)
 *
 * @param source - Caminho do arquivo local (string) ou um Stream
 * @param targetFilename - Nome do arquivo no R2
 * @param type - O tipo (pasta)
 */
const uploadFileToR2 = async (
  source: string | Readable,
  targetFilename: string,
  type: 'backup',
) => {
  if (!s3Client || !isR2ConfigComplete) {
    logger.error(
      '[StorageService] Tentativa de upload falhou: Cliente R2 não configurado.',
    );
    throw new HttpError('Serviço de armazenamento (R2) não inicializado.', 500);
  }

  const fileKey = getFileKey(targetFilename, type);
  const body =
    typeof source === 'string' ? fs.createReadStream(source) : source;

  const command = new PutObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: fileKey,
    Body: body,
    // (Poderíamos adicionar ContentType se soubéssemos, ex: 'application/gzip')
  });

  try {
    logger.info(`[StorageService] Iniciando upload para R2 key: ${fileKey}`);
    await s3Client.send(command);
    logger.info(`[StorageService] Upload de ${fileKey} concluído.`);
  } catch (error) {
    logger.error(error, `[StorageService] Erro ao fazer upload do ${fileKey}:`);
    throw error; // Lança o erro, pois o backup falhou
  }
};

/**
 * Exportamos um serviço singleton (objeto) com os métodos.
 */
export const storageService = {
  deleteFileFromR2,
  uploadFileToR2,
  getFileKey,
};