/*
 * Arquivo: src/types/index.d.ts
 * Descrição:
 * Define tipos globais para a aplicação, incluindo extensões
 * para o objeto Request do Express e declarações "shim" para
 * módulos sem tipos.
 */

/**
 * Importa a interface do payload que definimos no nosso utilitário JWT.
 */
import { IJwtPayload } from '@/security/auth/jwt';

/**
 * [FIX TS7016] Adiciona uma declaração "shim" para o módulo 'rate-limit-mongo'.
 * Esta linha informa ao TypeScript que o módulo existe, mesmo sem tipos.
 */
declare module 'rate-limit-mongo';

/**
 * Extensão do namespace 'Express' global.
 * Adiciona propriedades customizadas ao objeto Request.
 */
declare global {
  namespace Express {
    export interface Request {
      /**
       * O payload do JWT decodificado, anexado pelo 'authMiddleware'.
       */
      user?: IJwtPayload;

      /**
       * (Adicionado para o apiKeyAuthMiddleware)
       * Anexa a empresa encontrada durante a autenticação da API Key.
       */
      empresa?: any;

      /**
       * (Adicionado para o uploadMiddleware)
       * O Multer anexa o ficheiro aqui.
       */
      file?: Express.Multer.File;
    }
  }
}

// Exportação vazia para garantir que este ficheiro seja tratado como um módulo.
export {};