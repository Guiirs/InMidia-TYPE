/*
 * Arquivo: src/security/middlewares/upload.middleware.ts
 * Descrição:
 * Configura o middleware 'Multer' para lidar com uploads de arquivos,
 * especificamente para o Cloudflare R2 (compatível com S3).
 *
 * Alterações (Melhoria de Robustez e Reutilização #5):
 * 1. [Robustez] Adicionada uma verificação de `config.isProduction`.
 * Se as variáveis de R2/S3 não estiverem configuradas em produção,
 * a aplicação agora lançará um erro fatal ao iniciar, em vez de
 * usar o `memoryStorage`, o que previne memory leaks.
 * 2. [Reutilização] O middleware foi refatorado como uma "factory"
 * (createUploadMiddleware).
 * 3. Esta factory permite criar instâncias de upload com diferentes
 * filtros de mimetypes e limites de tamanho.
 * 4. [Compatibilidade] Exportamos uma instância padrão chamada `upload`
 * (usando a factory com os mimetypes de imagem) para manter a
 * compatibilidade com as rotas (ex: placa.routes.ts) que já
 * importavam `upload`.
 */

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

    // 3. Configuração do Multer-S3
    storage = multerS3({
      s3: s3Client,
      bucket: config.R2_BUCKET_NAME!,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,

      // Gera a 'key' (nome do ficheiro) no R2
      key: (req: Request, file: Express.Multer.File, cb) => {
        const folderName = config.R2_FOLDER_NAME;

        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            logger.error(
              err,
              '[UploadMiddleware] Erro ao gerar bytes aleatórios:',
            );
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
    logger.error(
      error,
      '[UploadMiddleware] ERRO CRÍTICO ao configurar Multer-S3.',
    );
    // Se a configuração S3 falhar (ex: credenciais erradas), não use memory storage
    if (config.isProduction) {
      throw new Error(
        `Falha ao inicializar o S3Client: ${(error as Error).message}`,
      );
    }
    // Fallback apenas em dev
    logger.error(
      '[UploadMiddleware] Usando memoryStorage como fallback (APENAS DEV).',
    );
    storage = multer.memoryStorage();
  }
} else {
  // 4. [FIX] Failsafe de Robustez
  if (config.isProduction) {
    // Em produção, a aplicação NÃO DEVE iniciar sem storage configurado.
    logger.error(
      '[UploadMiddleware] ERRO CRÍTICO: Variáveis de ambiente R2/S3 (R2_ENDPOINT, R2_ACCESS_KEY_ID, etc.) não estão configuradas.',
    );
    throw new Error(
      'CONFIGURAÇÃO DE STORAGE R2/S3 OBRIGATÓRIA EM PRODUÇÃO',
    );
  } else {
    // Em dev, permite o fallback com um aviso alto
    logger.error(
      '[UploadMiddleware] ERRO CRÍTICO: R2 não configurado. Usando memoryStorage como fallback (NÃO USE EM PRODUÇÃO).',
    );
    storage = multer.memoryStorage();
  }
}

/**
 * [NOVO] Factory function para criar instâncias de middleware Multer.
 * Permite reutilizar o storage S3 com diferentes filtros de arquivo.
 *
 * @param allowedMimes Lista de mimetypes permitidos (ex: ['image/jpeg', 'application/pdf'])
 * @param maxFileSizeMB Tamanho máximo em Megabytes (default: 5)
 */
export const createUploadMiddleware = (
  allowedMimes: string[],
  maxFileSizeMB = 5,
) => {
  /**
   * Filtro de ficheiros dinâmico.
   */
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true); // Aceita o ficheiro
    } else {
      logger.warn(
        `[UploadMiddleware] Tipo de ficheiro inválido rejeitado: ${file.mimetype}. Permitidos: ${allowedMimes.join(
          ', ',
        )}`,
      );
      // Rejeita o ficheiro passando um erro
      cb(
        new HttpError(
          `Tipo de ficheiro inválido. Apenas ${allowedMimes.join(
            ', ',
          )} são permitidos.`,
          400, // Bad Request
        ),
      );
    }
  };

  return multer({
    storage: storage,
    limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
    fileFilter: fileFilter,
  });
};

/**
 * Lista de mimetypes padrão para imagens.
 */
const imageMimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
];

/**
 * [ALTERADO] A instância 'upload' agora é criada usando a factory.
 * Isto mantém a compatibilidade com as rotas (placa, cliente) que
 * importavam 'upload' diretamente.
 */
export const upload = createUploadMiddleware(imageMimes, 5); // 5MB padrão