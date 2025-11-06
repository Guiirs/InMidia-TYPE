/*
 * Arquivo: src/security/middlewares/upload.middleware.ts
 * Descrição:
 * Configura o middleware 'Multer' para lidar com uploads de arquivos,
 * especificamente para o Cloudflare R2 (compatível com S3) ou
 * um fallback para a memória se as variáveis de ambiente não estiverem definidas.
 * (Baseado no uploadMiddleware.js original)
 *
 * Alterações:
 * 1. [FIX] Corrigida a chamada `logger.error` na função `key` (linha 73)
 * para resolver o erro TS2769 (No overload matches this call).
 * A assinatura correta do Pino é `logger.error(Error, Message)`,
 * e não `logger.error(Message, Error)`.
 * 2. [Tipagem] Adicionado o tipo explícito `multer.StorageEngine` à variável `storage`.
 * 3. [Segurança/Comentário] Adicionado um comentário sobre a flag `acl: 'public-read'`.
 * 4. [Clean Code] A lógica de fallback para `memoryStorage` foi mantida.
 */

import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express'; // Usado para tipar o 'req'
import crypto from 'crypto';
import path from 'path';
import { config } from '@/config/index';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

// 1. Verifica se as variáveis de ambiente necessárias estão presentes
const isR2ConfigComplete =
  config.R2_ENDPOINT &&
  config.R2_ACCESS_KEY_ID &&
  config.R2_SECRET_ACCESS_KEY &&
  config.R2_BUCKET_NAME;

let s3Client: S3Client | null = null;
// [FIX] Adicionada tipagem explícita para o storage engine
let storage: multer.StorageEngine;

if (isR2ConfigComplete) {
  try {
    // 2. Configura o S3Client (necessário para o multer-s3)
    s3Client = new S3Client({
      endpoint: config.R2_ENDPOINT,
      region: 'auto', // R2 requer 'auto'
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID!,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY!,
      },
    });

    // 3. Configuração do Multer-S3 (lógica do uploadMiddleware.js original)
    storage = multerS3({
      s3: s3Client,
      bucket: config.R2_BUCKET_NAME!,

      // [Nota de Segurança/R2] 'public-read' é uma ACL do S3.
      // O Cloudflare R2 lida com a publicidade a nível de bucket.
      // Manter para compatibilidade com a lógica original.
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE, // Deteta o mimetype

      // Gera a 'key' (nome do ficheiro) no R2
      key: (req: Request, file: Express.Multer.File, cb) => {
        const folderName = config.R2_FOLDER_NAME; // ex: 'inmidia-uploads-sistema'

        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            // [FIX] Corrigida a assinatura do logger: logger.error(Error, Message)
            logger.error(
              err,
              '[UploadMiddleware] Erro ao gerar bytes aleatórios:',
            );
            return cb(err);
          }
          const filename =
            buf.toString('hex') + path.extname(file.originalname);

          // O Placa/ClienteService usará path.basename() para extrair 'filename'
          // O StorageService usará getFileKey(filename) para remontar este path
          const fileKey = `${folderName}/${filename}`;

          logger.debug(`[UploadMiddleware] Gerada key R2: ${fileKey}`);
          cb(null, fileKey);
        });
      },
    });

    logger.info('[UploadMiddleware] Multer-S3 (R2) configurado com sucesso.');
  } catch (error) {
    logger.error(
      error,
      '[UploadMiddleware] ERRO CRÍTICO ao configurar Multer-S3.',
    );
    // Failsafe (se a configuração falhar mesmo com envs)
    storage = multer.memoryStorage(); // Usa memória como fallback
  }
} else {
  // 4. Failsafe (Stub) se as variáveis R2 estiverem em falta
  logger.error(
    '[UploadMiddleware] ERRO CRÍTICO: Variáveis de ambiente R2 incompletas. Uploads não funcionarão (usando memoryStorage como fallback).',
  );
  storage = multer.memoryStorage();
}

/**
 * Filtro de ficheiros (lógica do uploadMiddleware.js original)
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(
      `[UploadMiddleware] Tipo de ficheiro inválido rejeitado: ${file.mimetype}`,
    );
    // Rejeita o ficheiro passando um erro (ordem correta: message, statusCode)
    cb(
      new HttpError(
        'Tipo de ficheiro inválido. Apenas imagens (jpeg, png, gif, webp, avif) são permitidas.',
        400, // Bad Request
      ),
    );
  }
};

/**
 * A instância do Multer configurada.
 * (Baseado no uploadMiddleware.js original)
 */
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (lógica do original)
  fileFilter: fileFilter,
});