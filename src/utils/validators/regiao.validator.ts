/*
 * Arquivo: src/utils/validators/regiao.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Regiao.
 *
 * Alterações:
 * 1. [Confirmação] O ficheiro está robusto e correto.
 * 2. [Boas Práticas] Reutiliza o `mongoIdSchema` (importado de
 * 'admin.validator.ts') para validar os IDs.
 * 3. [Boas Práticas] O schema `createRegiaoSchema` garante que
 * o nome não é vazio.
 * 4. [Clean Code] Adicionadas as exportações de tipos (DTOs)
 * para consistência e para serem usadas pelos controladores/serviços.
 */

import { z } from 'zod';
import { mongoIdSchema } from './admin.validator'; // Reutiliza o validador de ID

/**
 * Schema para POST /api/v1/regioes (Criação)
 */
export const createRegiaoSchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: 'O nome da região é obrigatório.' })
      .min(1, 'O nome da região não pode ser vazio.'),
  }),
});

/**
 * Schema para PUT /api/v1/regioes/:id (Atualização)
 */
export const updateRegiaoSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    nome: z
      .string({ required_error: 'O nome da região é obrigatório.' })
      .min(1, 'O nome da região não pode ser vazio.'),
  }),
});

// --- Exportação de Tipos (DTOs) ---
export type CreateRegiaoDto = z.infer<typeof createRegiaoSchema>['body'];
export type UpdateRegiaoDto = z.infer<typeof updateRegiaoSchema>['body'];