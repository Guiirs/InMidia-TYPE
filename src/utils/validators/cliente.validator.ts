import { z } from 'zod';
import { mongoIdParamSchema } from './admin.validator'; // Reutilizando o validador de MongoID
import { validarCNPJ } from './cnpj.validator';

// --- Esquema de Criação/Atualização (POST /clientes, PUT /clientes/:id) ---
// (Migração de 'validateClienteBody' em routes/clienteRoutes.js)
// (Corrigido para incluir 'email' conforme models/Cliente.js)
export const clienteBodySchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: 'O nome do cliente é obrigatório.' })
      .trim()
      .min(1, 'O nome do cliente é obrigatório.')
      .max(150, 'Nome muito longo (máx 150 caracteres).'),

    email: z
      .string({ required_error: 'O e-mail é obrigatório.' })
      .email('O e-mail fornecido não é válido.'),

    cnpj: z
      .string()
      .trim()
      .refine(validarCNPJ, 'O CNPJ fornecido é inválido.')
      .optional()
      .or(z.literal('')) // Permite nulo ou string vazia
      .nullable(),

    telefone: z
      .string()
      .trim()
      .max(50, 'Telefone muito longo (máx 50 caracteres).')
      .optional(),
      
    // (Campos do modelo JS original)
    endereco: z.string().trim().optional(),
    bairro: z.string().trim().optional(),
    cidade: z.string().trim().optional(),
    responsavel: z.string().trim().optional(),
    segmento: z.string().trim().optional(),
    
    // Campo do swagger/serviço (para upload)
    logo_url: z.string().optional(),
  }),
});

// Esquema para o PUT (combina ID e Body)
export const updateClienteSchema = z.object({
  params: mongoIdParamSchema.shape.params,
  // O body da atualização deve permitir campos parciais
  body: clienteBodySchema.shape.body.partial(),
});

// Tipo inferido do Zod
export type CreateClienteDto = z.infer<typeof clienteBodySchema>['body'];
export type UpdateClienteDto = z.infer<typeof updateClienteSchema>['body'];

// --- Esquema de Listagem (GET /api/v1/clientes) ---
// (Baseado nos query params do clienteService.js)
export const listClientesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(5000).default(1000).optional(), // Default 1000 (PIModal)
  }),
});

// Tipo inferido do Zod
export type ListClientesDto = z.infer<typeof listClientesSchema>['query'];