/**
 * Importa a interface do payload que definimos no nosso utilitário JWT.
 */
import { IJwtPayload } from '@/security/auth/jwt';

/**
 * Extensão do namespace 'Express' global.
 * Isto adiciona a propriedade 'user' ao objeto Request do Express,
 * permitindo o acesso tipado a `req.user` em todos os middlewares
 * e controladores subsequentes.
 */
declare global {
  namespace Express {
    export interface Request {
      /**
       * O payload do JWT decodificado, anexado pelo 'authMiddleware'.
       * Contém informações essenciais sobre o utilizador autenticado.
       */
      user?: IJwtPayload;

      /**
       * (Opcional - Adicionado para o apiKeyAuthMiddleware.js)
       * Anexa a empresa encontrada durante a autenticação da API Key.
       * Usamos 'any' por agora, mas idealmente seria 'IEmpresaDocument'.
       */
      empresa?: any;

      /**
       * (Opcional - Adicionado para o uploadMiddleware.js)
       * O Multer anexa o ficheiro aqui.
       */
      file?: Express.Multer.File;
    }
  }
}

// Exportação vazia para garantir que este ficheiro seja tratado como um módulo.
export {};