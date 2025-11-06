/*
 * Arquivo: src/api/routes/index.ts
 * Descrição:
 * Agregador principal de rotas da API.
 *
 * Alterações (CORREÇÃO DE BUG CRÍTICO):
 * 1. [FIX] Movidas as `authRoutes` (login, forgot-password, etc.)
 * para fora do `v1Router` protegido por `authMiddleware`.
 * 2. As rotas de autenticação agora são registadas diretamente
 * em `/api/v1/auth`, tornando-as públicas, como devem ser.
 * 3. As restantes rotas V1 (como /user, /placas) permanecem
 * protegidas pelo `authMiddleware` dentro do `v1Router`.
 */

import { Router } from 'express';
import { logger } from '@/config/logger';

// [NOVO] Importa os middlewares de segurança centralizados
import {
  authMiddleware,
  adminMiddleware,
} from '@/security/middlewares/index';

// Importação das rotas (V1 Protegidas e Públicas)
import { authRoutes } from './src/auth.routes'; // Rotas públicas V1
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
logger.info('[Routes Index] Mapeando rotas públicas de registo para /empresas');
router.use('/empresas', publicRegisterRoutes);

// --- Rotas Públicas (Protegidas por API Key) ---
logger.info('[Routes Index] Mapeando rotas públicas (API Key) para /public');
router.use('/public', publicApiRoutes);

// --- Rotas V1 Públicas (Autenticação) ---
// [FIX] Estas rotas não podem ter o authMiddleware global
logger.info('[Routes Index] Mapeando rotas públicas V1 (Auth) para /v1/auth');
router.use('/v1/auth', authRoutes);

// --- Rotas V1 (Protegidas por JWT) ---
logger.info('[Routes Index] Mapeando rotas V1 (Protegidas) para /v1');

const v1Router = Router();

// [ALTERADO] Aplica autenticação JWT (authMiddleware) a TODAS as rotas V1
v1Router.use(authMiddleware);

/*
 * Mapeamento de Rotas V1 Autenticadas
 */

// Rotas que *apenas* requerem autenticação (usuário logado)
// [REMOVIDO] v1Router.use('/auth', authRoutes); (Movido para cima)
v1Router.use('/user', userRoutes);
v1Router.use('/empresa', empresaRoutes);

/*
 * Mapeamento de Rotas V1 que requerem permissão de ADMIN
 */
v1Router.use(adminMiddleware);

v1Router.use('/admin', adminRoutes);
v1Router.use('/regioes', regiaoRoutes);
v1Router.use('/placas', placaRoutes);
v1Router.use('/clientes', clienteRoutes);
v1Router.use('/alugueis', aluguelRoutes);
v1Router.use('/pis', piRoutes);
v1Router.use('/contratos', contratoRoutes);
v1Router.use('/relatorios', relatorioRoutes);

// Anexa o router V1 (agora protegido) ao router principal
router.use('/v1', v1Router);

export const apiRouter = router;