/*
 * Arquivo: src/utils/validators/contrato.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Contrato.
 *
 * Alterações:
 * 1. [FIX TS2339] Corrigido o erro "Property 'min' does not exist".
 * 2. O erro ocorria em 'createContratoSchema' > 'piId'.
 * 3. Motivo: Não podemos encadear '.min()' *depois* de um schema
 * que usa '.refine()' (como o 'mongoIdSchema'), pois o tipo
 * muda de ZodString para ZodEffects.
 * 4. Solução: Removido o '.min(1, ...)'. O 'mongoIdSchema'
 * já é obrigatório por padrão (não é opcional), e a sua
 * própria lógica de 'refine' já falhará para uma string vazia.
 */

import { z } from 'zod';
import { mongoIdSchema } from './admin.validator'; // Reutiliza o validador de ID

/**
 * Schema para validar :id nos parâmetros (GET /:id, DELETE /:id, GET /:id/download)
 */
export const getContratoSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
});

/**
 * Schema para POST /api/v1/contratos (Criação)
 */
export const createContratoSchema = z.object({
  body: z.object({
    // [FIX] Removido o .min(1, ...) que causava o erro TS2339.
    // O mongoIdSchema (sendo um z.string()) já é obrigatório.
    piId: mongoIdSchema,
  }),
});

/**
 * Schema para PUT /api/v1/contratos/:id (Atualização de Status)
 */
export const updateContratoSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    status: z.enum(
      ['Pendente', 'Ativo', 'Concluído', 'Cancelado'], // Valores permitidos
      {
        required_error: 'O status é obrigatório.',
        invalid_type_error:
          "O status deve ser 'Pendente', 'Ativo', 'Concluído' ou 'Cancelado'.",
      },
    ),
  }),
});

/**
 * Schema para GET /api/v1/contratos (Listagem com filtros)
 */
export const listContratosSchema = z.object({
  query: z.object({
    // Filtro por status (opcional)
    status: z
      .enum(['Pendente', 'Ativo', 'Concluído', 'Cancelado'])
      .optional(),
    // Filtro por cliente (opcional)
    clienteId: mongoIdSchema.optional(),
  }),
});

// --- Exportação de Tipos (DTOs) ---
export type CreateContratoDto = z.infer<typeof createContratoSchema>['body'];
export type UpdateContratoDto = z.infer<typeof updateContratoSchema>['body'];
export type ListContratosDto = z.infer<typeof listContratosSchema>['query'];