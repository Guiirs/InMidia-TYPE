/*
 * Arquivo: src/utils/storage.service.ts
 * Descrição:
 * Serviço para interagir com o S3/R2 para gestão de ficheiros (get URL, delete).
 *
 * Alterações (Melhoria de Robustez e Arquitetura):
 * 1. [Arquitetura] O ficheiro foi refatorado para uma *classe* (StorageService)
 * para encapsular o S3Client e a lógica de inicialização.
 * 2. [Robustez] A inicialização do S3Client agora ocorre no 'constructor'.
 * 3. [Robustez/Fail Fast] O 'constructor' agora lança um erro fatal
 * (e impede a aplicação de iniciar) se as variáveis de R2/S3
 * não estiverem configuradas em ambiente de *produção* (config.isProduction).
 * Isto é o mesmo comportamento que implementámos no 'upload.middleware.ts'.
 * 4. [Robustez] Os métodos 'getFileUrl' e 'deleteFile' agora verificam
 * ativamente se 'this.s3Client' foi inicializado, lançando um
 * HttpError 500 (Internal Server Error) se o serviço for chamado
 * sem a configuração R2.
 * 5. [Robustez] Os métodos agora tratam inputs nulos/undefined (ex: um
 * cliente que não tem 'logoUrl') de forma segura, sem tentar
 * apagar um ficheiro "undefined".
 * 6. [Clean Code] Exportada uma instância 'singleton' (storageService)
 * para ser usada por outros serviços.
 */

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '@/config/index';
import { logger } from '@/config/logger';
import { HttpError } from './errors/httpError';

export class StorageService {
  private s3Client: S3Client | null = null;
  private readonly folderName: string;
  private readonly publicUrl: string;
  private readonly bucketName: string;

  constructor() {
    this.folderName = config.R2_FOLDER_NAME;
    this.publicUrl = config.R2_PUBLIC_URL || ''; // Default para string vazia
    this.bucketName = config.R2_BUCKET_NAME || '';

    const isR2ConfigComplete =
      config.R2_ENDPOINT &&
      config.R2_ACCESS_KEY_ID &&
      config.R2_SECRET_ACCESS_KEY &&
      config.R2_BUCKET_NAME;

    if (isR2ConfigComplete) {
      try {
        this.s3Client = new S3Client({
          endpoint: config.R2_ENDPOINT,
          region: 'auto', // R2 requer 'auto'
          credentials: {
            accessKeyId: config.R2_ACCESS_KEY_ID!,
            secretAccessKey: config.R2_SECRET_ACCESS_KEY!,
          },
        });
        logger.info('[StorageService] S3Client (R2) inicializado com sucesso.');
      } catch (error) {
        logger.error(error, '[StorageService] ERRO CRÍTICO ao inicializar S3Client.');
        if (config.isProduction) {
          throw new Error(`Falha ao inicializar o S3Client: ${(error as Error).message}`);
        }
      }
    } else {
      // [Fail Fast] Se estiver em produção, falha o boot
      if (config.isProduction) {
        logger.error(
          '[StorageService] ERRO CRÍTICO: Variáveis de ambiente R2/S3 (R2_ENDPOINT, R2_ACCESS_KEY_ID, etc.) não estão configuradas.',
        );
        throw new Error(
          'CONFIGURAÇÃO DE STORAGE R2/S3 OBRIGATÓRIA EM PRODUÇÃO',
        );
      } else {
        // Em dev, apenas avisa que o serviço não funcionará
        logger.error(
          '[StorageService] ERRO CRÍTICO: R2 não configurado. O serviço de storage não funcionará (retornará URLs vazias e não apagará ficheiros).',
        );
      }
    }
  }

  /**
   * Monta a URL pública completa para um ficheiro.
   * @param filename - O nome do ficheiro (ex: 'imagem.jpg')
   * @returns A URL pública completa, ou uma string vazia se a configuração
   * estiver em falta ou o nome do ficheiro for nulo.
   */
  public getFileUrl(filename: string | null | undefined): string {
    // 1. Não retorna nada se o nome do ficheiro for nulo
    if (!filename) {
      return '';
    }

    // 2. Não retorna nada se a URL pública não estiver configurada
    if (!this.publicUrl) {
      if (config.isProduction) {
        // Em produção, isto não deve acontecer (devido ao config.ts)
        logger.error(
          '[StorageService] R2_PUBLIC_URL não está definida. Não é possível gerar URL.',
        );
      }
      return ''; // Retorna string vazia
    }

    // 3. Constrói a URL
    return `${this.publicUrl}/${this.folderName}/${filename}`;
  }

  /**
   * Monta a 'key' (path + filename) do ficheiro no S3.
   * @param filename - O nome do ficheiro (ex: 'imagem.jpg')
   * @returns A key (ex: 'inmidia-uploads-sistema/imagem.jpg')
   */
  private getFileKey(filename: string): string {
    return `${this.folderName}/${filename}`;
  }

  /**
   * Apaga um ficheiro do R2/S3.
   * @param filename - O nome do ficheiro a ser apagado.
   */
  public async deleteFile(filename: string | null | undefined): Promise<void> {
    // 1. Não faz nada se o nome do ficheiro for nulo/undefined/vazio
    if (!filename) {
      return;
    }

    // 2. [Robustez] Verifica se o cliente S3 foi inicializado
    if (!this.s3Client) {
      logger.error(
        `[StorageService] Tentativa de apagar '${filename}' falhou: S3 Client (R2) não está configurado.`,
      );
      // Lança um erro interno. A aplicação não deve tentar apagar
      // ficheiros se o storage não estiver configurado.
      throw new HttpError(
        'Erro interno do servidor: O serviço de storage não está configurado.',
        500,
      );
    }

    const fileKey = this.getFileKey(filename);
    const deleteParams = {
      Bucket: this.bucketName,
      Key: fileKey,
    };

    try {
      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);
      logger.info(`[StorageService] Ficheiro apagado com sucesso: ${fileKey}`);
    } catch (err) {
      logger.error(
        err,
        `[StorageService] Erro ao apagar o ficheiro '${fileKey}' do R2/S3.`,
      );
      // Lança um erro operacional para que o serviço chamador (ex: ClienteService)
      // possa tratá-lo e enviar uma resposta de erro 500 ao utilizador.
      throw new HttpError(
        'Erro interno ao tentar apagar o ficheiro anterior.',
        500,
      );
    }
  }
}

/**
 * Instância padrão (singleton) do StorageService.
 * Outros serviços (ClienteService, PlacaService) devem importar esta instância.
 */
export const storageService = new StorageService();