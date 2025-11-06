/*
 * Arquivo: src/utils/validators/cliente.validator.ts
 * Descrição: Schemas de validação (Zod) para as rotas de Cliente.
 *
 * Alterações (Melhoria de Robustez):
 * 1. [FIX] Importado o `cnpjValidator` (de `./cnpj.validator`) e
 * aplicado aos campos 'cnpj' nos schemas de criação e atualização.
 * Isto garante que apenas CNPJs válidos sejam aceites.
 * 2. [FIX] Removido o campo `logo: z.string().optional()` dos schemas
 * `clienteBodySchema` e `updateClienteSchema` (body).
 * Motivo: As rotas de cliente usam `upload.single('logo')` (Multer),
 * o que significa que o 'logo' vem em `req.file`, e não em `req.body`.
 * O Zod (que valida `req.body`) não deve, portanto, validar este campo.
 * O controlador é responsável por extrair o 'logo' de `req.file`.
 * 3. [Clean Code] Adicionadas as exportações de tipos (DTOs)
 * para consistência e para serem usadas pelos controladores/serviços.
 */

import { z } from 'zod';
import { mongoIdSchema } from './admin.validator'; // Reutiliza o validador de ID
import { cnpjValidator } from './cnpj.validator'; // [NOVO] Importa o validador de CNPJ

/**
 * Schema base para os campos de endereço (reutilizável)
 */
const enderecoSchema = z
  .object({
    logradouro: z.string().min(1, 'O logradouro é obrigatório.'),
    numero: z.string().min(1, 'O número é obrigatório.'),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'O bairro é obrigatório.'),
    cidade: z.string().min(1, 'A cidade é obrigatória.'),
    uf: z
      .string()
      .length(2, 'A UF (Estado) deve ter exatamente 2 caracteres.'),
    cep: z
      .string()
      .length(8, 'O CEP deve ter exatamente 8 caracteres (apenas números).'),
  })
  .optional();

/**
 * Schema para POST /api/v1/clientes (Criação)
 */
export const clienteBodySchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: 'O nome é obrigatório.' })
      .min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    // [REMOVIDO] logo: z.string().optional(), (Vem de req.file, não req.body)
    cnpj: cnpjValidator, // [ALTERADO] Usa o validador de CNPJ
    email: z
      .string({ required_error: 'O email é obrigatório.' })
      .email('O email fornecido é inválido.')
      .optional(), // O modelo permite ser opcional
    telefone: z
      .string()
      .min(10, 'O telefone deve ter pelo menos 10 dígitos.')
      .optional(),
    endereco: enderecoSchema,
  }),
});

/**
 * Schema para PUT /api/v1/clientes/:id (Atualização)
 */
export const updateClienteSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  // No body, todos os campos são opcionais
  body: z
    .object({
      nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
      // [REMOVIDO] logo: z.string().optional(), (Vem de req.file, não req.body)
      cnpj: cnpjValidator, // [ALTERADO] Usa o validador de CNPJ
      email: z.string().email('O email fornecido é inválido.'),
      telefone: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos.'),
      endereco: enderecoSchema.nullable(), // Permite enviar null para apagar o endereço
    })
    .partial() // Torna todos os campos opcionais
    .refine(
      (data) => Object.keys(data).length > 0,
      'O corpo da requisição não pode estar vazio. Pelo menos um campo deve ser fornecido para atualização.',
    ),
});

/**
 * Schema para GET /api/v1/clientes (Listagem com paginação)
 */
export const listClientesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    search: z.string().optional(),
  }),
});

// --- Exportação de Tipos (DTOs) ---
// (Agora corretos, sem o campo 'logo')
export type ClienteBodyDto = z.infer<typeof clienteBodySchema>['body'];
export type UpdateClienteDto = z.infer<typeof updateClienteSchema>['body'];
export type ListClientesDto = z.infer<typeof listClientesSchema>['query'];