/*
 * Arquivo: src/utils/validators/pi.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Proposta Interna (PI).
 *
 * Alterações:
 * 1. [Confirmação] O ficheiro está robusto e correto.
 * 2. [Boas Práticas] Reutiliza o `mongoIdSchema` (importado de
 * 'admin.validator.ts') para validar os IDs.
 * 3. [Boas Práticas] O schema `piBodySchema` usa
 * `z.array(piItemSchema).min(1, ...)` para garantir que uma PI
 * não pode ser criada sem pelo menos um item, o que é excelente.
 * 4. [Clean Code] Adicionadas as exportações de tipos (DTOs)
 * para consistência e para serem usadas pelos controladores/serviços.
 */

import { z } from 'zod';
import { mongoIdSchema } from './admin.validator'; // Reutiliza o validador de ID

/**
 * Schema base para os itens *dentro* de uma PI (reutilizável)
 */
const piItemSchema = z.object({
  placaId: mongoIdSchema,
  data_inicio: z
    .string({ required_error: 'A data de início do item é obrigatória.' })
    .datetime({ message: 'A data de início deve estar no formato ISO 8601.' }),
  data_fim: z
    .string({ required_error: 'A data de fim do item é obrigatória.' })
    .datetime({ message: 'A data de fim deve estar no formato ISO 8601.' }),
});

/**
 * Schema para POST /api/v1/pis (Criação)
 */
export const piBodySchema = z.object({
  body: z.object({
    clienteId: mongoIdSchema,
    data_pi: z
      .string({ required_error: 'A data da PI é obrigatória.' })
      .datetime({ message: 'A data da PI deve estar no formato ISO 8601.' }),
    // Garante que a PI tenha pelo menos 1 item no array
    itens: z
      .array(piItemSchema)
      .min(1, 'A PI deve ter pelo menos um item (placa).'),
  }),
});

/**
 * Schema para PUT /api/v1/pis/:id (Atualização)
 */
export const updatePiSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  // No body, todos os campos são opcionais
  body: z
    .object({
      clienteId: mongoIdSchema,
      data_pi: z.string().datetime({
        message: 'A data da PI deve estar no formato ISO 8601.',
      }),
      // Se 'itens' for enviado, deve ter pelo menos 1 item
      itens: z
        .array(piItemSchema)
        .min(1, 'A PI deve ter pelo menos um item (placa).'),
      status: z.enum(['Pendente', 'Concluída', 'Cancelada']),
    })
    .partial(), // Torna todos os campos opcionais
});

/**
 * Schema para GET /api/v1/pis (Listagem com filtros)
 */
export const listPisSchema = z.object({
  query: z.object({
    status: z.enum(['Pendente', 'Concluída', 'Cancelada']).optional(),
    clienteId: mongoIdSchema.optional(),
  }),
});

// --- Exportação de Tipos (DTOs) ---
export type PiBodyDto = z.infer<typeof piBodySchema>['body'];
export type UpdatePiDto = z.infer<typeof updatePiSchema>['body'];
export type ListPisDto = z.infer<typeof listPisSchema>['query'];