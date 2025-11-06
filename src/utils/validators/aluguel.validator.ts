import { z } from 'zod';
import { mongoIdParamSchema } from './admin.validator'; // Reutilizando o validador de MongoID

// Validador de MongoID (para ser usado no DTO)
const mongoId = (message: string) =>
  z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message,
  });

// --- Esquema de Criação (POST /api/v1/alugueis) ---
// (Migração de 'validateAluguel' em routes/aluguelRoutes.js)
export const createAluguelSchema = z.object({
  body: z
    .object({
      // (Nota: o original usava placa_id/cliente_id, mas os modelos usam placa/cliente.
      // Manteremos placa_id/cliente_id no DTO para compatibilidade com o JS original,
      // mas o serviço irá renomeá-los para o repositório.)
      placa_id: mongoId('ID da placa é obrigatório e inválido.'),
      cliente_id: mongoId('ID do cliente é obrigatório e inválido.'),
      data_inicio: z
        .string({ required_error: 'Data de início é obrigatória.' })
        .datetime({ message: 'Data de início inválida (formato ISO 8601).' })
        .transform((date) => new Date(date)), // Converte para objeto Date
      data_fim: z
        .string({ required_error: 'Data final é obrigatória.' })
        .datetime({ message: 'Data final inválida (formato ISO 8601).' })
        .transform((date) => new Date(date)),
    })
    // Validação customizada (lógica do JS original)
    .refine((data) => data.data_fim > data.data_inicio, {
      message: 'A data final deve ser posterior à data inicial.',
      path: ['data_fim'], // Onde o erro será reportado
    }),
});

// Tipo inferido do Zod
export type CreateAluguelDto = z.infer<typeof createAluguelSchema>['body'];

// --- Esquema para Buscar por Placa (GET /api/v1/alugueis/placa/:placaId) ---
// (Migração de 'validatePlacaIdParam' em routes/aluguelRoutes.js)
export const getAlugueisByPlacaSchema = z.object({
  params: z.object({
    placaId: mongoId('O ID da placa fornecido é inválido.'),
  }),
});

// --- Esquema para Deletar Aluguel (DELETE /api/v1/alugueis/:id) ---
// (Migração de 'validateIdParam' em routes/aluguelRoutes.js)
export const deleteAluguelSchema = z.object({
  params: mongoIdParamSchema.shape.params, // Reutiliza a validação do ID
});