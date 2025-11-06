import { z } from 'zod';
import { mongoIdParamSchema } from './admin.validator'; // Reutilizando o validador de MongoID

// Validador de MongoID
const mongoId = (message: string) =>
  z.string().refine((val) => /^[0-9a-fAF]{24}$/.test(val), {
    message,
  });

// --- Esquema de Criação/Atualização (POST /placas, PUT /placas/:id) ---
// (Migração de 'placaValidationRules' em placaValidator.js)
// Nota: O Multer (upload) não é validado pelo Zod; validamos os campos de texto.
export const placaBodySchema = z.object({
  body: z.object({
    numero_placa: z
      .string({ required_error: 'O número da placa é obrigatório.' })
      .trim()
      .min(1, 'O número da placa é obrigatório.')
      .max(50, 'Número da placa muito longo (máx 50 caracteres).'),

    regiao: mongoId('O ID da região é obrigatório e deve ser um MongoID.'),

    coordenadas: z
      .string()
      .trim()
      .matches(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/, {
        message: 'Formato de coordenadas inválido (ex: -3.12, -38.45).',
      })
      .max(100, 'Coordenadas muito longas (máx 100 caracteres).')
      .optional()
      .or(z.literal('')), // Permite string vazia

    nomeDaRua: z
      .string()
      .trim()
      .max(255, 'Nome da rua muito longo (máx 255 caracteres).')
      .optional()
      .or(z.literal('')),

    tamanho: z
      .string()
      .trim()
      .max(50, 'Tamanho muito longo (máx 50 caracteres).')
      .optional()
      .or(z.literal('')),

    // No PUT, 'disponivel' pode ser enviado
    disponivel: z.coerce.boolean().optional(),
  }),
});

// Esquema para o PUT (combina ID e Body)
export const updatePlacaSchema = z.object({
  params: mongoIdParamSchema.shape.params,
  body: placaBodySchema.shape.body,
});

// Tipos inferidos do Zod
export type CreatePlacaDto = z.infer<typeof placaBodySchema>['body'];
export type UpdatePlacaDto = z.infer<typeof updatePlacaSchema>['body'];

// --- Esquema de Listagem (GET /api/v1/placas) ---
// (Migração dos query params em swaggerConfig.js)
export const listPlacasSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    sortBy: z
      .enum(['numero_placa', 'nomeDaRua', 'createdAt'])
      .default('createdAt')
      .optional(),
    order: z.enum(['asc', 'desc']).default('desc').optional(),
    search: z.string().optional(),
    regiao_id: z
      .string()
      .optional()
      .refine((val) => val === 'todas' || /^[0-9a-fA-F]{24}$/.test(val ?? ''), {
        message: 'O ID da região deve ser um MongoID válido ou "todas".',
      }),
    disponivel: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  }),
});

// Tipo inferido do Zod
export type ListPlacasDto = z.infer<typeof listPlacasSchema>['query'];

// --- Esquema de Disponibilidade (GET /api/v1/placas/disponiveis) ---
// (Baseado nos parâmetros do serviço 'getPlacasDisponiveis')
export const checkDisponibilidadeSchema = z.object({
  query: z.object({
    dataInicio: z
      .string({ required_error: 'dataInicio é obrigatória.' })
      .datetime({ message: 'dataInicio deve ser uma data ISO 8601.' }),
    dataFim: z
      .string({ required_error: 'dataFim é obrigatória.' })
      .datetime({ message: 'dataFim deve ser uma data ISO 8601.' }),
    regiao: mongoId('O ID da região deve ser um MongoID válido.').optional(),
    search: z.string().optional(),
  }).refine((data) => new Date(data.dataFim) > new Date(data.dataInicio), {
      message: "A data de fim deve ser posterior à data de início.",
      path: ["dataFim"], // Onde o erro será reportado
  }),
});

// Tipo inferido do Zod
export type CheckDisponibilidadeDto = z.infer<typeof checkDisponibilidadeSchema>['query'];