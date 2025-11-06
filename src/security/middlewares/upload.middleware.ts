import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express';
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
let storage; // O storage do Multer

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
      acl: 'public-read', // Define os ficheiros como públicos
      contentType: multerS3.AUTO_CONTENT_TYPE, // Deteta o mimetype
      
      // Gera a 'key' (nome do ficheiro) no R2
      key: (req: Request, file: Express.Multer.File, cb) => {
        const folderName = config.R2_FOLDER_NAME; // ex: 'inmidia-uploads-sistema'
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            logger.error('[UploadMiddleware] Erro ao gerar bytes aleatórios:', err);
            return cb(err);
          }
          const filename =
            buf.toString('hex') + path.extname(file.originalname);
          const fileKey = `${folderName}/${filename}`;
          
          logger.debug(`[UploadMiddleware] Gerada key R2: ${fileKey}`);
          cb(null, fileKey);
        });
      },
    });
    
    logger.info('[UploadMiddleware] Multer-S3 (R2) configurado com sucesso.');

  } catch (error) {
    logger.error(error, '[UploadMiddleware] ERRO CRÍTICO ao configurar Multer-S3.');
    // Failsafe (se a configuração falhar mesmo com envs)
    storage = multer.memoryStorage(); // Usa memória como fallback (NÃO IDEAL)
  }
} else {
  // 4. Failsafe (Stub) se as variáveis R2 estiverem em falta
  // (Baseado no Failsafe do uploadMiddleware.js original)
  logger.error(
    '[UploadMiddleware] ERRO CRÍTICO: Variáveis de ambiente R2 incompletas. Uploads não funcionarão corretamente (usando memoryStorage como fallback).',
  );
  // Usamos memoryStorage para evitar que a app quebre,
  // mas o serviço (ex: PlacaService) não saberá lidar com isso sem o 'file.key'.
  // O ideal é travar a app se o R2 for obrigatório em produção.
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
    // Rejeita o ficheiro passando um erro
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