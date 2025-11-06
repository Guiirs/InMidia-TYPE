/*
 * Arquivo: src/api/routes/src/empresa.routes.ts
 * Descrição: Define as rotas de gestão da Empresa (ex: /api/v1/empresa/...).
 *
 * Alterações (Correção de Bug TS2769):
 * 1. [FIX TS2769] Adicionada a asserção `as any` ao método do
 * controlador que é chamado *após* o middleware `validate`.
 * 2. [REMOVIDO] `authMiddleware` foi removido (agora é global).
 * 3. [MANTIDO] `adminMiddleware` foi mantido localmente.
 */

import { Router } from 'express';
import { empresaController } from '@/api/controllers/src/empresa.controller';
import { logger } from '@/config/logger';

// Middlewares
import { adminMiddleware } from '@/security/middlewares/src/admin.middleware';
import { validate } from '@/security/middlewares/src/validate.middleware';

// Validadores Zod (DTOs)
import { updateEmpresaSchema } from '@/utils/validators/user.validator';

const router = Router();

logger.info('[Routes] Definindo rotas de Empresa (/empresa)...');

// A autenticação JWT é aplicada globalmente em src/api/routes/index.ts

/**
 * @route   GET /api/v1/empresa/details
 * @desc    Busca os detalhes da empresa (Nome, Endereço, etc.)
 * @access  Privado (Admin)
 */
router.get(
  '/details',
  adminMiddleware, // 1. Garante que é Admin
  // (Sem 'validate', não precisa de 'as any')
  empresaController.getEmpresaDetails as any, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/empresa/details
 * @desc    Atualiza os detalhes da empresa
 * @access  Privado (Admin)
 */
router.put(
  '/details',
  adminMiddleware, // 1. Garante que é Admin
  validate(updateEmpresaSchema), // 2. Valida o body (Zod)
  empresaController.updateEmpresaDetails as any, // 3. [FIX] Chama o controlador
);

export const empresaRoutes = router;