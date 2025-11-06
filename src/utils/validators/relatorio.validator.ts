/*
 * Arquivo: src/utils/validators/relatorio.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Relatório.
 *
 * Alterações:
 * 1. [Confirmação] O ficheiro está robusto e correto.
 * 2. [Boas Práticas] O schema `ocupacaoPorPeriodoSchema` usa:
 * - `.datetime()` para garantir que as strings de data/hora estão no formato ISO.
 * - `.transform()` para converter as strings em objetos Date.
 * - `.refine()` para garantir que data_fim > data_inicio.
 * Esta é uma implementação de validação de datas muito robusta.
 * 3. [Clean Code] Adicionada a exportação do tipo (DTO)
 * `OcupacaoPorPeriodoDto` para consistência e para ser usada
 * pelo controlador/serviço (que espera receber objetos Date).
 */

import { z } from 'zod';

/**
 * Schema para GET /api/v1/relatorios/ocupacao-por-periodo (e export)
 *
 * Este schema valida os query params (strings), transforma-os em
 * objetos Date e, em seguida, valida se a data de fim é
 * posterior à data de início.
 */
export const ocupacaoPorPeriodoSchema = z.object({
  query: z
    .object({
      data_inicio: z
        .string({ required_error: 'A data de início é obrigatória.' })
        .datetime({
          message: 'A data de início deve estar no formato ISO 8601.',
        })
        // Transforma a string ISO válida num objeto Date
        .transform((dateStr) => new Date(dateStr)),

      data_fim: z
        .string({ required_error: 'A data de fim é obrigatória.' })
        .datetime({
          message: 'A data de fim deve estar no formato ISO 8601.',
        })
        // Transforma a string ISO válida num objeto Date
        .transform((dateStr) => new Date(dateStr)),
    })
    // Validação cruzada (refine)
    .refine(
      (data) => {
        // Agora 'data.data_inicio' e 'data.data_fim' são objetos Date
        return data.data_fim > data.data_inicio;
      },
      {
        message: 'A data de fim deve ser posterior à data de início.',
        path: ['data_fim'], // Onde o erro deve ser reportado
      },
    ),
});

// --- Exportação de Tipos (DTOs) ---

/**
 * Este tipo (DTO) é inferido *após* a transformação.
 * O controlador que o receber terá 'data_inicio' e 'data_fim'
 * como objetos Date, e não como strings.
 */
export type OcupacaoPorPeriodoDto = z.infer<
  typeof ocupacaoPorPeriodoSchema
>['query'];