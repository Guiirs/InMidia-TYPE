/*
 * Arquivo: src/utils/validators/auth.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas públicas de
 * autenticação e registo.
 *
 * Alterações:
 * 1. [Confirmação] O ficheiro está robusto e correto.
 * 2. [Boas Práticas] A importação e uso do `cnpjValidator` (no
 * `registerEmpresaSchema`) é uma excelente prática de modularização.
 * 3. [Boas Práticas] O uso de `.refine()` para verificar se
 * `password_confirmation` corresponde à `password` (em
 * `registerEmpresaSchema` e `resetPasswordSchema`) é uma
 * prática de segurança robusta.
 * 4. [Clean Code] Adicionadas as exportações de tipos (DTOs)
 * para consistência e para serem usadas pelos controladores/serviços.
 */

import { z } from 'zod';
import { cnpjValidator } from './cnpj.validator'; // Importa o validador de CNPJ

/**
 * Schema para POST /api/v1/auth/login
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'O email é obrigatório.' })
      .email('Email inválido.'),
    password: z
      .string({ required_error: 'A senha é obrigatória.' })
      .min(1, 'A senha é obrigatória.'),
  }),
});

/**
 * Schema para POST /api/empresas/register
 */
export const registerEmpresaSchema = z
  .object({
    body: z.object({
      // Empresa
      nome_empresa: z
        .string({ required_error: 'O nome da empresa é obrigatório.' })
        .min(2, 'O nome da empresa deve ter pelo menos 2 caracteres.'),
      cnpj: cnpjValidator, // Usa o validador de CNPJ

      // Admin
      username: z
        .string({ required_error: 'O nome de utilizador é obrigatório.' })
        .min(3, 'O nome de utilizador deve ter pelo menos 3 caracteres.'),
      email: z
        .string({ required_error: 'O email é obrigatório.' })
        .email('O email fornecido é inválido.'),
      password: z
        .string({ required_error: 'A senha é obrigatória.' })
        .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
      password_confirmation: z.string({
        required_error: 'A confirmação da senha é obrigatória.',
      }),
      nome: z
        .string({ required_error: 'O nome é obrigatório.' })
        .min(2, 'O nome deve ter pelo menos 2 caracteres.'),
      sobrenome: z
        .string({ required_error: 'O sobrenome é obrigatório.' })
        .min(2, 'O sobrenome deve ter pelo menos 2 caracteres.'),
    }),
  })
  // Validação de confirmação de senha
  .refine((data) => data.body.password === data.body.password_confirmation, {
    message: 'As senhas não correspondem.',
    path: ['body', 'password_confirmation'], // O campo que deve receber o erro
  });

/**
 * Schema para POST /api/v1/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'O email é obrigatório.' })
      .email('Email inválido.'),
  }),
});

/**
 * Schema para POST /api/v1/auth/reset-password/:token
 */
export const resetPasswordSchema = z
  .object({
    params: z.object({
      token: z.string({ required_error: 'O token é obrigatório.' }),
    }),
    body: z.object({
      newPassword: z
        .string({ required_error: 'A nova senha é obrigatória.' })
        .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
      password_confirmation: z.string({
        required_error: 'A confirmação da senha é obrigatória.',
      }),
    }),
  })
  // Validação de confirmação de senha
  .refine(
    (data) => data.body.newPassword === data.body.password_confirmation,
    {
      message: 'As senhas não correspondem.',
      path: ['body', 'password_confirmation'],
    },
  );

// --- Exportação de Tipos (DTOs) ---
export type LoginDto = z.infer<typeof loginSchema>['body'];
export type RegisterEmpresaDto = z.infer<typeof registerEmpresaSchema>['body'];
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>['body'];
export type ResetPasswordParams = z.infer<typeof resetPasswordSchema>['params'];