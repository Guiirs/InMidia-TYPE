/*
 * Arquivo: src/utils/validators/aluguel.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Aluguel.
 *
 * Alterações:
 * 1. [Confirmação] O ficheiro está robusto e correto.
 * 2. [Boas Práticas] Reutiliza o `mongoIdSchema` (importado de
 * 'admin.validator.ts'), o que é excelente (princípio DRY).
 * 3. [Boas Práticas] Valida as datas como strings ISO 8601 (`.datetime()`),
 * que é o formato correto para JSON.
 * 4. [Clean Code] Adicionada a exportação de tipo `CreateAluguelDto`
 * para consistência e para ser usada pelo controlador/serviço.
 */

import { z } from 'zod';
import { mongoIdSchema } from './admin.validator'; // Reutiliza o validador de ID

/**
 * Schema para POST /api/v1/alugueis
 * (Criação de um novo aluguel/reserva)
 */
export const createAluguelSchema = z.object({
  body: z.object({
    placaId: mongoIdSchema,
    data_inicio: z
      .string({ required_error: 'A data de início é obrigatória.' })
      .datetime({ message: 'A data de início deve estar no formato ISO 8601.' }),
    data_fim: z
      .string({ required_error: 'A data de fim é obrigatória.' })
      .datetime({ message: 'A data de fim deve estar no formato ISO 8601.' }),
  }),
});

/**
 * Schema para DELETE /api/v1/alugueis/:id
 * (Cancela um aluguel)
 */
export const deleteAluguelSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
});

/**
 * Schema para GET /api/v1/alugueis/placa/:placaId
 * (Busca aluguéis de uma placa específica)
 */
export const getAlugueisByPlacaSchema = z.object({
  params: z.object({
    placaId: mongoIdSchema,
  }),
});

// --- Exportação de Tipos (DTOs) ---
export type CreateAluguelDto = z.infer<typeof createAluguelSchema>['body'];