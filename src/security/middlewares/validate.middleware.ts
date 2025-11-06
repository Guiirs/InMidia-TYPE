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
    // O 'path' é um array (ex: ['placas', 0, 'id'] ou ['nome'])
    const field = issue.path.join('.');
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
      // O 'parse' do Zod já lança um erro se a validação falhar
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
        logger.warn(
          `[ValidateMiddleware] Erro de validação Zod na rota ${req.path}`,
          error.flatten(),
        );

        // Formata os erros (replicando a lógica do authValidator.js)
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