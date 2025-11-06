import { z } from 'zod';
import { mongoIdParamSchema } from './admin.validator'; // Reutilizando o validador de MongoID

// Validador de MongoID (para ser usado no DTO)
const mongoId = (message: string) =>
  z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message,
  });

// Enum de Status (baseado no model)
const statusContratoEnum = z.enum(['rascunho', 'ativo', 'concluido', 'cancelado']);

// --- Esquema de Criação (POST /api/v1/contratos) ---
// (Migração de 'validateContratoCreateBody')
export const createContratoSchema = z.object({
  body: z.object({
    piId: mongoId('O ID da PI (Proposta Interna) é obrigatório e inválido.'),
  }),
});

// Tipo inferido do Zod
export type CreateContratoDto = z.infer<typeof createContratoSchema>['body'];

// --- Esquema de Atualização (PUT /api/v1/contratos/:id) ---
// (Migração de 'validateContratoUpdateBody')
export const updateContratoSchema = z.object({
  params: mongoIdParamSchema.shape.params, // Reutiliza a validação do ID
  body: z
    .object({
      status: statusContratoEnum.optional(),
    })
    // Garante que APENAS o status pode ser atualizado (segurança)
    .strict('Apenas o campo "status" pode ser atualizado.')
    .refine(
      (data) => Object.keys(data).length > 0,
      'Pelo menos um campo (status) deve ser fornecido.',
    ),
});

// Tipo inferido do Zod
export type UpdateContratoDto = z.infer<typeof updateContratoSchema>['body'];

// --- Esquema de Listagem (GET /api/v1/contratos) ---
// (Baseado nos query params do contratoService.js)
export const listContratosSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    sortBy: z.string().default('createdAt').optional(),
    order: z.enum(['asc', 'desc']).default('desc').optional(),
    status: statusContratoEnum.optional(),
    clienteId: mongoId('O ID do cliente deve ser um MongoID válido.').optional(),
  }),
});

// Tipo inferido do Zod
export type ListContratosDto = z.infer<typeof listContratosSchema>['query'];

// --- Esquema para GetById, Delete, Download (rotas com :id) ---
// (Migração de 'validateIdParam')
export const getContratoSchema = z.object({
  params: mongoIdParamSchema.shape.params, // Reutiliza a validação do ID
});