import 'dotenv/config'; // Carrega as variáveis de .env para process.env
import { z } from 'zod';

/**
 * Define o schema de validação para as variáveis de ambiente.
 * Isso garante que a aplicação não inicie sem as configurações críticas.
 */
const envSchema = z.object({
  // Ambiente
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(4000),

  // Banco de Dados
  MONGODB_URI: z.string().url('MONGODB_URI deve ser uma URL de conexão válida'),

  // Autenticação
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  // CORS
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL deve ser uma URL válida')
    .default('http://localhost:5173'),

  // Armazenamento (Cloudflare R2 / S3)
  // Opcional em dev/test, mas obrigatório em produção.
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  R2_FOLDER_NAME: z.string().default('inmidia-uploads-sistema'),

  // PDF (API Externa - baseado no .env.example original)
  PDF_REST_API_KEY: z.string().optional(),
  PDF_REST_ENDPOINT: z.string().url().optional(),
});

/**
 * Tenta validar process.env.
 * Se falhar, loga um erro fatal e encerra o processo.
 */
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    '❌ Erro fatal: Variáveis de ambiente inválidas:',
    _env.error.format(),
  );
  process.exit(1);
}

/**
 * Configuração da aplicação validada e tipada.
 */
export const config = {
  ..._env.data,
  isProduction: _env.data.NODE_ENV === 'production',
  isDevelopment: _env.data.NODE_ENV === 'development',
  isTest: _env.data.NODE_ENV === 'test',
};

// Validação específica para R2 em produção
if (
  config.isProduction &&
  (!config.R2_ENDPOINT ||
    !config.R2_ACCESS_KEY_ID ||
    !config.R2_SECRET_ACCESS_KEY ||
    !config.R2_BUCKET_NAME ||
    !config.R2_PUBLIC_URL)
) {
  console.error(
    '❌ Erro fatal: Configurações de armazenamento R2/S3 são obrigatórias em produção.',
  );
  process.exit(1);
}