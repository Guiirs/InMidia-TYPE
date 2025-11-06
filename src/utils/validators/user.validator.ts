/*
 * Arquivo: src/utils/validators/user.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Utilizador (/user).
 *
 * Alterações:
 * 1. [Confirmação] O ficheiro está robusto e correto.
 * 2. [Boas Práticas] O uso de `.partial()` para os schemas de
 * atualização (permitindo que o utilizador envie apenas os
 * campos que deseja alterar) está correto.
 * 3. [Boas Práticas] O uso de `.refine()` para validar a
 * confirmação de senha (em `updatePasswordSchema`) está correto.
 * 4. [Segurança] O schema `regenerateApiKeySchema` exige
 * a senha do admin para confirmar a regeneração da chave,
 * o que é uma excelente prática de segurança ("sudo mode").
 */

import { z } from 'zod';
import { cnpjValidator } from './cnpj.validator'; // (Usado para o updateEmpresaSchema)

/**
 * Schema para PUT /api/v1/user/me (Atualização de perfil do utilizador)
 */
export const updateUserProfileSchema = z.object({
  body: z
    .object({
      username: z
        .string()
        .min(3, 'O nome de utilizador deve ter pelo menos 3 caracteres.'),
      email: z.string().email('O email fornecido é inválido.'),
      nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
      sobrenome: z
        .string()
        .min(2, 'O sobrenome deve ter pelo menos 2 caracteres.'),
    })
    .partial() // Torna todos os campos opcionais
    .refine(
      (data) => Object.keys(data).length > 0,
      'Pelo menos um campo deve ser fornecido para atualização.',
    ),
});

/**
 * Schema para PUT /api/v1/user/me/password (Atualização de senha)
 * (Nota: Esta rota não está implementada em user.routes.ts, mas o schema existe)
 */
export const updatePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: z
        .string({ required_error: 'A senha atual é obrigatória.' })
        .min(1, 'A senha atual é obrigatória.'),
      newPassword: z
        .string({ required_error: 'A nova senha é obrigatória.' })
        .min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
      password_confirmation: z.string({
        required_error: 'A confirmação da senha é obrigatória.',
      }),
    }),
  })
  .refine(
    (data) => data.body.newPassword === data.body.password_confirmation,
    {
      message: 'As senhas não correspondem.',
      path: ['body', 'password_confirmation'],
    },
  );

/**
 * Schema para PUT /api/v1/empresa/details (Atualização de Empresa)
 * (Usado também em user.routes.ts? Não, apenas em empresa.routes.ts)
 */
export const updateEmpresaSchema = z.object({
  body: z
    .object({
      nome: z.string().min(2, 'O nome da empresa deve ter pelo menos 2 caracteres.'),
      cnpj: cnpjValidator,
      endereco: z.object({
        logradouro: z.string().min(1, 'O logradouro é obrigatório.'),
        numero: z.string().min(1, 'O número é obrigatório.'),
        complemento: z.string().optional(),
        bairro: z.string().min(1, 'O bairro é obrigatório.'),
        cidade: z.string().min(1, 'A cidade é obrigatória.'),
        uf: z
          .string()
          .length(2, 'A UF (Estado) deve ter exatamente 2 caracteres.'),
        cep: z
          .string()
          .length(8, 'O CEP deve ter exatamente 8 caracteres (apenas números).'),
      }),
    })
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      'Pelo menos um campo deve ser fornecido para atualização.',
    ),
});

/**
 * Schema para POST /api/v1/user/me/empresa/regenerate-api-key
 * (Exige a senha do Admin para confirmar a ação)
 */
export const regenerateApiKeySchema = z.object({
  body: z.object({
    password: z
      .string({ required_error: 'A sua senha é obrigatória para confirmar esta ação.' })
      .min(1, 'A senha é obrigatória.'),
  }),
});

// --- Exportação de Tipos (DTOs) ---
export type UpdateUserProfileDto = z.infer<
  typeof updateUserProfileSchema
>['body'];
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>['body'];
export type UpdateEmpresaDto = z.infer<typeof updateEmpresaSchema>['body'];
export type RegenerateApiKeyDto = z.infer<
  typeof regenerateApiKeySchema
>['body'];