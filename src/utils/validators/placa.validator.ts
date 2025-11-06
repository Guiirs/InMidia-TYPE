/*
 * Arquivo: src/utils/validators/placa.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Placa.
 *
 * Alterações (Melhoria de Robustez):
 * 1. [FIX] Removido o campo `imagem: z.string().optional()` dos schemas
 * `placaBodySchema` e `updatePlacaSchema` (body).
 * 2. Motivo: As rotas de placa usam `upload.single('imagem')` (Multer),
 * o que significa que a 'imagem' vem em `req.file`, e não em `req.body`.
 * O Zod (que valida `req.body`) não deve validar este campo.
 * O controlador é responsável por extrair a 'imagem' de `req.file`.
 * 3. [Boas Práticas] O schema `checkDisponibilidadeSchema` usa `.refine()`
 * para garantir que `data_fim` é posterior a `data_inicio`,
 * o que é uma excelente prática.
 * 4. [Clean Code] Adicionadas as exportações de tipos (DTOs)
 * para consistência e para serem usadas pelos controladores/serviços.
 */

import { z } from 'zod';
import { mongoIdSchema } from './admin.validator'; // Reutiliza o validador de ID

/**
 * Schema para POST /api/v1/placas (Criação)
 */
export const placaBodySchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: 'O nome (identificador) é obrigatório.' })
      .min(1, 'O nome é obrigatório.'),
    regiaoId: mongoIdSchema,
    latitude: z.coerce.number({
      required_error: 'A latitude é obrigatória.',
      invalid_type_error: 'A latitude deve ser um número.',
    }),
    longitude: z.coerce.number({
      required_error: 'A longitude é obrigatória.',
      invalid_type_error: 'A longitude deve ser um número.',
    }),
    // [REMOVIDO] imagem: z.string().optional(), (Vem de req.file, não req.body)
  }),
});

/**
 * Schema para PUT /api/v1/placas/:id (Atualização)
 */
export const updatePlacaSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  // No body, todos os campos são opcionais
  body: z
    .object({
      nome: z.string().min(1, 'O nome é obrigatório.'),
      regiaoId: mongoIdSchema,
      latitude: z.coerce.number({
        invalid_type_error: 'A latitude deve ser um número.',
      }),
      longitude: z.coerce.number({
        invalid_type_error: 'A longitude deve ser um número.',
      }),
      // [REMOVIDO] imagem: z.string().optional(), (Vem de req.file, não req.body)
    })
    .partial() // Torna todos os campos opcionais
    .refine(
      (data) => Object.keys(data).length > 0,
      'O corpo da requisição não pode estar vazio. Pelo menos um campo deve ser fornecido para atualização.',
    ),
});

/**
 * Schema para GET /api/v1/placas (Listagem com paginação e filtros)
 */
export const listPlacasSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    search: z.string().optional(),
    regiaoId: mongoIdSchema.optional(),
  }),
});

/**
 * Schema para GET /api/v1/placas/disponiveis (Check de disponibilidade)
 */
export const checkDisponibilidadeSchema = z
  .object({
    query: z.object({
      data_inicio: z
        .string({ required_error: 'A data de início é obrigatória.' })
        .datetime({
          message: 'A data de início deve estar no formato ISO 8601.',
        }),
      data_fim: z
        .string({ required_error: 'A data de fim é obrigatória.' })
        .datetime({
          message: 'A data de fim deve estar no formato ISO 8601.',
        }),
      // Filtros opcionais
      regiaoId: mongoIdSchema.optional(),
      clienteId: mongoIdSchema.optional(),
    }),
  })
  // Validação cruzada
  .refine(
    (data) => {
      const inicio = new Date(data.query.data_inicio);
      const fim = new Date(data.query.data_fim);
      return fim > inicio;
    },
    {
      message: 'A data de fim deve ser posterior à data de início.',
      path: ['query', 'data_fim'], // Onde o erro deve ser reportado
    },
  );

// --- Exportação de Tipos (DTOs) ---
// (Agora corretos, sem o campo 'imagem')
export type PlacaBodyDto = z.infer<typeof placaBodySchema>['body'];
export type UpdatePlacaDto = z.infer<typeof updatePlacaSchema>['body'];
export type ListPlacasDto = z.infer<typeof listPlacasSchema>['query'];
export type CheckDisponibilidadeDto = z.infer<
  typeof checkDisponibilidadeSchema
>['query'];