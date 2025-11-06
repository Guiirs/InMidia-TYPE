/*
 * Arquivo: src/utils/errors/httpError.ts
 * Descrição: Classe de erro customizada para erros operacionais (HTTP).
 * (Baseado no AppError.js original)
 *
 * Alterações:
 * 1. [Confirmação] Este ficheiro está robusto e correto.
 * 2. A classe estende `Error` corretamente, define `isOperational` e
 * captura o stack trace, o que é crucial para o `errorHandler` global.
 * 3. A propriedade opcional `validationErrors` está corretamente
 * definida para ser usada pelo `validate.middleware.ts`.
 */

/**
 * Classe de erro customizada para erros operacionais (HTTP).
 *
 * Esta classe estende o Error nativo e adiciona informações de status HTTP
 * e um marcador 'isOperational' para o errorHandler global.
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly status: 'fail' | 'error';
  public readonly isOperational: boolean;

  /**
   * (Opcional) Usado para transportar erros de validação (Zod)
   */
  public validationErrors?: Record<string, string>;

  /**
   * Cria uma instância de HttpError.
   * @param message - A mensagem de erro descritiva (para o cliente).
   * @param statusCode - O código de status HTTP (ex: 400, 404, 500).
   */
  constructor(message: string, statusCode: number) {
    super(message); // Chama o construtor da classe Error pai

    this.statusCode = statusCode;
    // Define o status (fail para 4xx, error para 5xx)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Marca este erro como operacional (erro esperado)
    this.isOperational = true;

    // Garante que o 'name' da classe seja 'HttpError' (bom para debugging)
    this.name = this.constructor.name;

    // Captura o stack trace, excluindo o construtor da própria classe
    Error.captureStackTrace(this, this.constructor);
  }
}