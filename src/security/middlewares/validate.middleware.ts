/*
 * Arquivo: src/security/middlewares/validate.middleware.ts
 * Descrição:
 * Este middleware de alta ordem (Higher-Order Middleware) integra o Zod
 * ao fluxo do Express. Ele recebe um schema Zod e valida o `req.body`,
 * `req.query` e `req.params`.
 *
 * Alterações:
 * 1. [FIX] Corrigida a chamada `logger.warn` para resolver o erro TS2769.
 * O objeto de erro (`error.flatten()`) agora é passado como o *primeiro*
 * argumento, e a mensagem de string como o *segundo*,
 * conforme a assinatura do Pino: `logger.warn(objeto, mensagem)`.
 * 2. [Clean Code] A função `formatZodError` foi ajustada para usar `slice(1)`,
 * removendo os prefixos 'body.' ou 'params.' das chaves de erro
 * (ex: "nome" em vez de "body.nome"), o que melhora a resposta da API.
 * 3. [Error Handling] O restante da lógica, incluindo a criação do
 * `HttpError` (com os parâmetros na ordem correta) e o `validationErrors`,
 * foi mantido.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodIssue } from 'zod';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

/**
 * Formata os erros do Zod num objeto { field: message }
 * (Semelhante ao que o handleValidationErrors do authValidator.js fazia)
 *
 * @param zodError - A instância do erro Zod.
 * @returns Um objeto mapeando campos para mensagens de erro.
 */
const formatZodError = (zodError: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};

  zodError.issues.forEach((issue: ZodIssue) => {
    // O 'path' é um array (ex: ['body', 'nome'] ou ['query', 'page'])
    // Usamos .slice(1) para remover o prefixo (body, query, params)
    const field = issue.path.slice(1).join('.');
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
};

/**
 * Cria um middleware de validação que utiliza um schema Zod.
 *
 * @param schema - O schema Zod (um ZodObject) para validar a requisição.
 * @returns Um middleware Express.
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Tenta validar o 'body', 'params' e 'query' da requisição
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Se a validação for bem-sucedida, continua para o controlador
      return next();
    } catch (error) {
      // Se o erro for uma instância de ZodError
      if (error instanceof ZodError) {
        // [FIX] Corrigida a chamada do logger para: logger.warn(objeto, mensagem)
        logger.warn(
          { errors: error.flatten() }, // 1. O objeto de erro
          `[ValidateMiddleware] Erro de validação Zod na rota ${req.path}`, // 2. A mensagem
        );

        // Formata os erros para a resposta da API
        const formattedErrors = formatZodError(error);

        // Cria um HttpError estruturado (que o errorHandler global irá tratar)
        const httpError = new HttpError(
          'Erro de validação nos dados enviados.',
          400, // Bad Request
        );

        // Anexa os erros de validação detalhados ao objeto de erro
        httpError.validationErrors = formattedErrors;

        return next(httpError);
      }

      // Se for outro tipo de erro (inesperado)
      logger.error(
        error,
        '[ValidateMiddleware] Erro inesperado durante a validação.',
      );
      return next(
        new HttpError('Erro interno durante a validação da requisição.', 500),
      );
    }
  };