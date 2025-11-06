import { z } from 'zod';
import { mongoIdParamSchema } from './admin.validator'; // Reutilizando o validador de MongoID

// --- Esquema de Criação de Região (POST /api/v1/regioes) ---
// (Migração de 'validateRegiaoBody' em routes/regiaoRoutes.js)
export const createRegiaoSchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: 'O nome da região é obrigatório.' })
      .trim()
      .min(1, 'O nome da região é obrigatório.')
      .max(100, 'Nome da região muito longo (máx 100 caracteres).'),
  }),
});

// Tipo inferido do Zod
export type CreateRegiaoDto = z.infer<typeof createRegiaoSchema>['body'];

// --- Esquema de Atualização de Região (PUT /api/v1/regioes/:id) ---
// (Migração de 'validateIdParam' e 'validateRegiaoBody' em routes/regiaoRoutes.js)
export const updateRegiaoSchema = z.object({
  params: mongoIdParamSchema.shape.params, // Reutiliza a validação do ID
  body: createRegiaoSchema.shape.body, // Reutiliza a validação do body
});

// Tipo inferido do Zod
export type UpdateRegiaoDto = z.infer<typeof updateRegiaoSchema>['body'];