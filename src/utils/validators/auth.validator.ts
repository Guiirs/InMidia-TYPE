import { z } from 'zod';
import { validarCNPJ } from './cnpj.validator';

// --- Esquema de Registo (Migração de validators/empresaValidator.js) ---
export const registerEmpresaSchema = z.object({
  body: z.object({
    // Empresa
    nome_empresa: z
      .string({ required_error: 'O nome da empresa é obrigatório.' })
      .trim()
      .min(1, 'O nome da empresa é obrigatório.')
      .max(150, 'Nome da empresa muito longo (máx 150 caracteres).'),

    cnpj: z
      .string({ required_error: 'O CNPJ é obrigatório.' })
      .trim()
      .refine(validarCNPJ, 'O CNPJ fornecido é inválido.'),

    // Admin User
    nome: z
      .string({ required_error: 'O nome do administrador é obrigatório.' })
      .trim()
      .min(1, 'O nome do administrador é obrigatório.')
      .max(100, 'Nome muito longo (máx 100 caracteres).'),

    sobrenome: z
      .string({ required_error: 'O sobrenome do administrador é obrigatório.' })
      .trim()
      .min(1, 'O sobrenome do administrador é obrigatório.')
      .max(100, 'Sobrenome muito longo (máx 100 caracteres).'),

    username: z
      .string({ required_error: 'O nome de utilizador é obrigatório.' })
      .trim()
      .min(3, 'O nome de utilizador deve ter entre 3 e 50 caracteres.')
      .max(50, 'O nome de utilizador deve ter entre 3 e 50 caracteres.')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'O nome de utilizador só pode conter letras, números e underscores.',
      ),

    email: z
      .string({ required_error: 'O e-mail é obrigatório.' })
      .email('Forneça um e-mail válido.')
      .max(100, 'E-mail muito longo (máx 100 caracteres).'),

    password: z
      .string({ required_error: 'A senha é obrigatória.' })
      .min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  }),
});

// Tipo inferido do Zod para o DTO de registo
export type RegisterEmpresaDto = z.infer<typeof registerEmpresaSchema>['body'];

// --- Esquema de Login (Migração de routes/auth.js) ---
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'O e-mail é obrigatório.' })
      .email('O e-mail fornecido não é válido.'),
    // Nota: O original permitia login por email ou username.
    // O authService.js (original) fazia findOne({ $or: [{ username }, { email }] }).
    // O validator original (auth.js) só pedia 'email'.
    // Vamos manter o pedido de 'email' no body, mas o serviço tratará como "email ou username".
    password: z
      .string({ required_error: 'A senha é obrigatória.' })
      .min(1, 'A senha é obrigatória.'),
  }),
});

// Tipo inferido do Zod para o DTO de login
export type LoginDto = z.infer<typeof loginSchema>['body'];

// --- Esquema de Forgot Password (Migração de routes/auth.js) ---
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'O e-mail é obrigatório.' })
      .email('O e-mail fornecido não é válido.'),
  }),
});

// --- Esquema de Reset Password (Migração de routes/auth.js) ---
export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'O token de redefinição é obrigatório.'),
  }),
  body: z.object({
    newPassword: z
      .string()
      .min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
  }),
});