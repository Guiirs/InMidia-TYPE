/*
 * Arquivo: src/utils/errors/errorHandler.ts
 * Descrição: Middleware Global de Tratamento de Erros.
 *
 * Alterações (Correção de Bug TS2783):
 * 1. [FIX] Corrigida a chamada `logger.error` para resolver o erro TS2783.
 * 2. Em vez de fazer o "spread" (`...err`) do objeto de erro e
 * copiar as suas propriedades (o que causa a duplicação do 'message'),
 * agora passamos o objeto `err` diretamente para o logger (Pino).
 * 3. O Pino é otimizado para serializar objetos de erro, garantindo
 * que o 'stack', 'message', 'name' e outras propriedades (como
 * 'validationErrors') sejam logados corretamente, sem conflitos.
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
//import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { config } from '@/config/index';
import { logger } from '@/config/logger';
import { HttpError } from './httpError';

/**
 * Converte erros de Cast (ID inválido) do Mongoose em um HttpError operacional.
 */
const handleCastErrorDB = (err: mongoose.Error.CastError): HttpError => {
  const message = `Recurso inválido. ${err.path}: ${err.value}.`;
  return new HttpError(message, 400); // 400 Bad Request
};

/**
 * Converte erros de chave duplicada (11000) do Mongoose em um HttpError.
 */
const handleDuplicateFieldsDB = (err: any): HttpError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `O campo '${field}' com valor '${value}' já existe. Por favor, use outro valor.`;
  return new HttpError(message, 409); // 409 Conflict
};

/**
 * Converte erros de validação do Mongoose em um HttpError.
 */
const handleValidationErrorDB = (
  err: mongoose.Error.ValidationError,
): HttpError => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Dados de entrada inválidos: ${errors.join('. ')}`;
  return new HttpError(message, 400); // 400 Bad Request
};

/**
 * Converte erros de JWT (token inválido).
 */
const handleJWTError = (): HttpError =>
  new HttpError('Token inválido. Por favor, faça login novamente.', 401);

/**
 * Converte erros de JWT (token expirado).
 */
const handleJWTExpiredError = (): HttpError =>
  new HttpError('O seu token expirou. Por favor, faça login novamente.', 401);

/**
 * Envia uma resposta de erro detalhada (para ambiente de desenvolvimento).
 */
const sendErrorDev = (err: HttpError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    // Exibe erros de validação (Zod) se existirem
    validationErrors: err.validationErrors,
    error: err, // Objeto de erro completo
  });
};

/**
 * Envia uma resposta de erro controlada (para ambiente de produção).
 */
const sendErrorProd = (err: HttpError, res: Response) => {
  // A) Erro Operacional (HttpError): Envia mensagem confiável ao cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      // Adiciona erros de validação (ex: do Zod) se existirem
      ...(err.validationErrors && { errors: err.validationErrors }),
    });
  }
  // B) Erro de programação ou desconhecido: Não vaza detalhes
  else {
    // 2. Envia resposta genérica
    res.status(500).json({
      status: 'error',
      message:
        'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    });
  }
};

/**
 * Middleware Global de Tratamento de Erros.
 * Deve ser o último middleware a ser usado no app.ts.
 */
export const errorHandler = (
  err: Error | HttpError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  // Garante que o status code exista
  const statusCode = (err as HttpError).statusCode || 500;

  // [FIX] Melhora a deteção de IP (considerando proxies)
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip;

  // [ALTERADO] Log centralizado e estruturado (Pino)
  // Corrigido para resolver o erro TS2783 ('message' overwritten)
  logger.error(
    {
      // [FIX] Passa o objeto 'err' diretamente. O Pino sabe
      // serializar (stack, message, name, etc.)
      err,
      // Contexto da requisição
      req: {
        url: req.originalUrl,
        method: req.method,
        ip: ip,
      },
      statusCode: statusCode,
    },
    `[ErrorHandler] ${err.message}`, // Mensagem de sumário
  );

  let error = err;

  // Se não for um HttpError, tenta converter
  if (!(error instanceof HttpError)) {
    // Converte erros específicos do Mongoose ou JWT
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error as mongoose.Error.CastError);
    } else if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error as mongoose.Error.ValidationError);
    } else if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    } else if ((error as any).code === 11000) {
      error = handleDuplicateFieldsDB(error);
    } else {
      // Se for um erro genérico (ex: 'fs' error), cria um HttpError 500
      error = new HttpError(
        'Ocorreu um erro interno no servidor.',
        500,
      );
    }
  }

  // Envia a resposta baseada no ambiente (Development vs Production)
  if (config.isDevelopment) {
    sendErrorDev(error as HttpError, res);
  } else {
    sendErrorProd(error as HttpError, res);
  }
};