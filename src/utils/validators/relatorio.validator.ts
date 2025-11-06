import { z } from 'zod';

// --- Esquema de Relatório de Ocupação (GET /relatorios/ocupacao-por-periodo) ---
// (Migração de 'validateDateRange' em routes/relatoriosRoutes.js)
export const ocupacaoPorPeriodoSchema = z.object({
  query: z
    .object({
      data_inicio: z
        .string({ required_error: 'O parâmetro data_inicio é obrigatório.' })
        .datetime({
          message: 'Data de início inválida. Use o formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).',
        })
        .transform((date) => new Date(date)), // Converte para objeto Date

      data_fim: z
        .string({ required_error: 'O parâmetro data_fim é obrigatório.' })
        .datetime({
          message: 'Data de fim inválida. Use o formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).',
        })
        .transform((date) => new Date(date)),
    })
    // Validação de intervalo (lógica do JS)
    .refine((data) => data.data_fim > data.data_inicio, {
      message: 'A data de fim deve ser posterior à data de início.',
      path: ['data_fim'],
    }),
});

// Tipo inferido do Zod
export type OcupacaoPorPeriodoDto = z.infer<
  typeof ocupacaoPorPeriodoSchema
>['query'];