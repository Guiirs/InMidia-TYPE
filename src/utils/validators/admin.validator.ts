import { z } from 'zod';

// Schema para validar Mongo IDs nos parâmetros (ex: /admin/users/:id)
export const mongoIdParamSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'O ID fornecido é inválido (não é um MongoID).',
    }),
  }),
});

// --- Esquema de Criação de Utilizador (POST /api/v1/admin/users) ---
// (Migração de 'validateUserCreation' em routes/adminRoutes.js)
export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3, 'O nome de utilizador deve ter entre 3 e 50 caracteres.')
      .max(50, 'O nome de utilizador deve ter entre 3 e 50 caracteres.')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'O nome de utilizador só pode conter letras, números e underscores.',
      ),
    email: z
      .string()
      .email('Forneça um e-mail válido.')
      .max(100, 'E-mail muito longo (máx 100 caracteres).'),
    password: z
      .string()
      .min(6, 'A senha deve ter no mínimo 6 caracteres.'),
    nome: z
      .string()
      .trim()
      .min(1, 'O nome é obrigatório.')
      .max(100, 'Nome muito longo (máx 100 caracteres).'),
    sobrenome: z
      .string()
      .trim()
      .min(1, 'O sobrenome é obrigatório.')
      .max(100, 'Sobrenome muito longo (máx 100 caracteres).'),
    role: z
      .enum(['user', 'admin'], {
        errorMap: () => ({
          message: "A 'role' fornecida é inválida. Use 'admin' ou 'user'.",
        }),
      })
      .optional()
      .default('user'),
  }),
});

// Tipo inferido do Zod
export type CreateUserDto = z.infer<typeof createUserSchema>['body'];

// --- Esquema de Atualização de Role (PUT /api/v1/admin/users/:id/role) ---
// (Migração de 'validateRoleUpdate' em routes/adminRoutes.js)
export const updateUserRoleSchema = z.object({
  params: mongoIdParamSchema.shape.params, // Reutiliza a validação do ID
  body: z.object({
    role: z.enum(['user', 'admin'], {
      required_error: "O campo 'role' é obrigatório.",
      errorMap: () => ({
        message: "A 'role' fornecida é inválida. Use 'admin' ou 'user'.",
      }),
    }),
  }),
});

// Tipo inferido do Zod
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>['body'];