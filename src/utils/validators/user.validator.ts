import { z } from 'zod';

// --- Esquema de Atualização de Perfil (PUT /api/v1/user/me) ---
// (Migração das validações em routes/user.js)
export const updateUserProfileSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .email('O e-mail fornecido não é válido.')
        .max(100, 'E-mail muito longo (máx 100 caracteres).')
        .optional(),
      username: z
        .string()
        .trim()
        .min(3, 'O nome de utilizador deve ter entre 3 e 50 caracteres.')
        .max(50, 'O nome de utilizador deve ter entre 3 e 50 caracteres.')
        .regex(
          /^[a-zA-Z0-9_]+$/,
          'O nome de utilizador só pode conter letras, números e underscores.',
        )
        .optional(),
      password: z
        .string()
        .min(6, 'A nova senha precisa ter no mínimo 6 caracteres.')
        .optional(),
      nome: z
        .string()
        .trim()
        .max(100, 'Nome muito longo (máx 100 caracteres).')
        .optional(),
      sobrenome: z
        .string()
        .trim()
        .max(100, 'Sobrenome muito longo (máx 100 caracteres).')
        .optional(),
      avatar_url: z.string().url('A URL do avatar não é válida.').optional(),
    })
    // Garante que pelo menos um campo foi enviado para atualização
    .refine(
      (data) => Object.keys(data).length > 0,
      'Pelo menos um campo deve ser fornecido para atualização.',
    ),
});

// Tipo inferido do Zod para o DTO de atualização
export type UpdateUserProfileDto = z.infer<
  typeof updateUserProfileSchema
>['body'];

// --- Esquema de Regenerar API Key (POST /api/v1/user/me/empresa/regenerate-api-key) ---
// (Migração da validação em routes/user.js)
export const regenerateApiKeySchema = z.object({
  body: z.object({
    password: z
      .string({
        required_error:
          'A sua senha atual é obrigatória para regenerar a chave.',
      })
      .min(
        1,
        'A sua senha atual é obrigatória para regenerar a chave.',
      ),
  }),
});

// Tipo inferido do Zod para o DTO de regeneração de chave
export type RegenerateApiKeyDto = z.infer<
  typeof regenerateApiKeySchema
>['body'];

// --- Esquema de Atualização de Empresa (PUT /api/v1/empresa/details) ---
// (Migração de validators/empresaValidator.js -> updateEmpresaRules)
// Embora relacionado à empresa, é usado pelo 'empresaService', que
// vamos criar a seguir.
export const updateEmpresaSchema = z.object({
  body: z
    .object({
      nome: z
        .string()
        .trim()
        .min(1, 'O nome da empresa não pode ficar vazio.')
        .optional(),
      cnpj: z
        .string()
        .trim()
        .min(1, 'O CNPJ não pode ficar vazio.')
        // A validação completa do CNPJ (com 'refine') é feita no registo.
        // Aqui, apenas garantimos que não está vazio se for enviado.
        .optional(),
      endereco: z.string().trim().optional(),
      bairro: z.string().trim().optional(),
      cidade: z.string().trim().optional(),
      telefone: z.string().trim().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      'Pelo menos um campo deve ser fornecido para atualização.',
    ),
});

// Tipo inferido do Zod
export type UpdateEmpresaDto = z.infer<typeof updateEmpresaSchema>['body'];