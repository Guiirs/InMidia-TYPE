/*
 * Arquivo: src/utils/validators/admin.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Administração.
 *
 * Alterações:
 * 1. [Confirmação] O ficheiro está robusto e correto.
 * 2. [Boas Práticas] A validação `mongoIdSchema` usando
 * `z.string().refine((val) => Types.ObjectId.isValid(val), ...)`
 * é a forma correta e segura de validar IDs do MongoDB.
 * 3. [Boas Práticas] O uso de `z.object({ body: ... })` e
 * `z.object({ params: ... })` está correto para o `validate.middleware.ts`.
 */

import { z } from 'zod';
import { Types } from 'mongoose'; // Usado para validar Mongo IDs

/**
 * Schema reutilizável para validar um Mongo ID (ex: em params).
 */
export const mongoIdSchema = z.string().refine(
  (val) => {
    return Types.ObjectId.isValid(val);
  },
  {
    message: 'O ID fornecido não é um ObjectId válido.',
  },
);

/**
 * Schema para validar apenas os parâmetros de rota (:id).
 * (Usado em DELETE /users/:id, GET /users/:id/role)
 */
export const mongoIdParamSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
});

/**
 * Schema para POST /api/v1/admin/users
 * (Criação de um novo utilizador pela administração)
 */
export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: 'O nome de utilizador é obrigatório.' })
      .min(3, 'O nome de utilizador deve ter pelo menos 3 caracteres.'),
    email: z
      .string({ required_error: 'O email é obrigatório.' })
      .email('O email fornecido é inválido.'),
    password: z
      .string({ required_error: 'A senha é obrigatória.' })
      .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    nome: z
      .string({ required_error: 'O nome é obrigatório.' })
      .min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    sobrenome: z
      .string({ required_error: 'O sobrenome é obrigatório.' })
      .min(2, 'O sobrenome deve ter pelo menos 2 caracteres.'),
    role: z.enum(['user', 'admin'], {
      required_error: "A 'role' é obrigatória.",
      invalid_type_error: "A 'role' deve ser 'user' ou 'admin'.",
    }),
  }),
});

/**
 * Schema para PUT /api/v1/admin/users/:id/role
 * (Atualização da role de um utilizador)
 */
export const updateUserRoleSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    role: z.enum(['user', 'admin'], {
      required_error: "A 'role' é obrigatória.",
      invalid_type_error: "A 'role' deve ser 'user' ou 'admin'.",
    }),
  }),
});

// --- Exportação de Tipos (DTOs) ---
// (Usado pelos Controladores/Serviços para tipagem forte)

export type CreateUserDto = z.infer<typeof createUserSchema>['body'];
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>['body'];
export type MongoIdParamDto = z.infer<typeof mongoIdParamSchema>['params'];