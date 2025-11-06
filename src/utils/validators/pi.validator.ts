import { z } from 'zod';
import { mongoIdParamSchema } from './admin.validator'; // Reutilizando o validador de MongoID

// Validador de MongoID (para ser usado no DTO)
const mongoId = (message: string) =>
  z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message,
  });

// --- Esquema de Criação/Atualização (POST /pis, PUT /pis/:id) ---
// (Migração de 'piValidationRules' em validators/piValidator.js)
export const piBodySchema = z.object({
  body: z
    .object({
      clienteId: mongoId('O ID do cliente é obrigatório e inválido.'),
      tipoPeriodo: z.enum(['quinzenal', 'mensal'], {
        required_error: 'O tipo de período é obrigatório.',
        errorMap: () => ({
          message: "O tipo de período deve ser 'quinzenal' ou 'mensal'.",
        }),
      }),
      dataInicio: z
        .string({ required_error: 'Data de início é obrigária.' })
        .datetime({ message: 'Data de início inválida (formato ISO 8601).' })
        .transform((date) => new Date(date)),
      dataFim: z
        .string({ required_error: 'Data final é obrigatória.' })
        .datetime({ message: 'Data final inválida (formato ISO 8601).' })
        .transform((date) => new Date(date)),
      valorTotal: z.coerce.number({
        required_error: 'O valor total é obrigatório.',
        invalid_type_error: 'O valor total deve ser um número.',
      }),
      descricao: z
        .string({ required_error: 'A descrição é obrigatória.' })
        .trim()
        .min(1, 'A descrição é obrigatória.'),
      
      // Campos adicionados no modelo
      formaPagamento: z.string().trim().optional(),
      placas: z.array(mongoId('Cada ID de placa deve ser um MongoId válido.')).optional(),
    })
    // Validação customizada de datas (lógica do JS)
    .refine((data) => data.dataFim > data.dataInicio, {
      message: 'A data final deve ser posterior à data inicial.',
      path: ['dataFim'],
    }),
});

// Esquema para o PUT (combina ID e Body)
export const updatePiSchema = z.object({
  params: mongoIdParamSchema.shape.params,
  // O body da atualização deve permitir campos parciais
  body: piBodySchema.shape.body.partial(),
});

// Tipos inferidos do Zod
export type CreatePiDto = z.infer<typeof piBodySchema>['body'];
export type UpdatePiDto = z.infer<typeof updatePiSchema>['body'];

// --- Esquema de Listagem (GET /api/v1/pis) ---
// (Baseado nos query params do swaggerConfig.js)
export const listPisSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    sortBy: z.string().default('createdAt').optional(), // (Validação relaxada, o repo deve tratar)
    order: z.enum(['asc', 'desc']).default('desc').optional(),
    status: z
      .enum(['em_andamento', 'concluida', 'vencida'])
      .optional(),
    clienteId: mongoId('O ID do cliente deve ser um MongoID válido.').optional(),
  }),
});

// Tipo inferido do Zod
export type ListPisDto = z.infer<typeof listPisSchema>['query'];