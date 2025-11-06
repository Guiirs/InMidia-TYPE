/*
 * Arquivo: src/security/middlewares/validate.middleware.ts
 * Descrição: Middleware de validação Zod.
 *
 * Alterações (Correção de Bug TS2345):
 * 1. [FIX] Corrigido o erro "Argument of type 'ZodEffects<...>' is not
 * assignable to parameter of type 'AnyZodObject'".
 * 2. Alterada a assinatura da função 'validate' de:
 * (schema: AnyZodObject)
 * para:
 * (schema: z.ZodSchema)
 * 3. [Robustez] 'z.ZodSchema' é o tipo base para todos os schemas Zod.
 * Isso permite que o middleware aceite tanto schemas simples
 * (ZodObject) quanto schemas complexos que usam '.refine()'
 * ou '.transform()' (ZodEffects).
 * 4. [FIX] Importado 'ZodSchema' de 'zod'.
 */

import { Request, Response, NextFunction } from 'express';
// [ALTERADO] Importa ZodSchema
import { ZodError, ZodIssue, ZodSchema } from 'zod';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

/**
 * Formata os erros do Zod num objeto { field: message }
 */
const formatZodError = (zodError: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};

  zodError.issues.forEach((issue: ZodIssue) => {
    // Usa .slice(1) para remover o prefixo (body, query, params)
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
 * @param schema - O schema Zod para validar a requisição.
 * @returns Um middleware Express.
 */
export const validate =
  // [ALTERADO] Aceita ZodSchema (mais genérico) em vez de AnyZodObject
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Tenta validar o 'body', 'params' e 'query' da requisição
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log "pino-idiomático" (objeto primeiro, mensagem depois)
        logger.warn(
          { errors: error.flatten() },
          `[ValidateMiddleware] Erro de validação Zod na rota ${req.path}`,
        );

        const formattedErrors = formatZodError(error);

        const httpError = new HttpError(
          'Erro de validação nos dados enviados.',
          400, // Bad Request
        );
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