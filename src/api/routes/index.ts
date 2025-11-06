import { Router } from 'express';
import { logger } from '@/config/logger';

// Importação das rotas (V1 Protegidas)
import { authRoutes } from './src/auth.routes';
import { userRoutes } from './src/user.routes';
import { adminRoutes } from './src/admin.routes';
import { empresaRoutes } from './src/empresa.routes';
import { regiaoRoutes } from './src/regiao.routes';
import { placaRoutes } from './src/placa.routes';
import { clienteRoutes } from './src/cliente.routes';
import { aluguelRoutes } from './src/aluguel.routes';
import { piRoutes } from './src/pi.routes';
import { contratoRoutes } from './src/contrato.routes';
import { relatorioRoutes } from './src/relatorio.routes';

// Importação das rotas (Públicas - API Key)
import { publicApiRoutes } from './src/public.routes';

// Importação das rotas (Registo Público - Sem Auth)
import { publicRegisterRoutes } from './src/publicRegister.routes';

/**
 * Agregador principal de rotas da API.
 */
const router = Router();

// --- Rotas Públicas (Sem JWT, Sem API Key) ---
// (Migração de)
logger.info('[Routes Index] Mapeando rotas públicas de registo para /empresas');
router.use('/empresas', publicRegisterRoutes);

// --- Rotas Públicas (Protegidas por API Key) ---
// (Migração de)
logger.info('[Routes Index] Mapeando rotas públicas (API Key) para /public');
router.use('/public', publicApiRoutes);

// --- Rotas V1 (Protegidas por JWT) ---
// (Migração de)
logger.info('[Routes Index] Mapeando rotas V1 (Protegidas) para /v1');
router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/empresa', empresaRoutes);
router.use('/v1/regioes', regiaoRoutes);
router.use('/v1/placas', placaRoutes);
router.use('/v1/clientes', clienteRoutes);
router.use('/v1/alugueis', aluguelRoutes);
router.use('/v1/pis', piRoutes);
router.use('/v1/contratos', contratoRoutes);
router.use('/v1/relatorios', relatorioRoutes);

export const apiRouter = router;