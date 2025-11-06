import { Router } from 'express';
import { empresaController } from '@/api/controllers/src/empresa.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { adminMiddleware } from '@/security/middlewares/admin.middleware';
import { validate } from '@/security/middlewares/validate.middleware';

// Validadores Zod (DTOs)
import { updateEmpresaSchema } from '@/utils/validators/user.validator'; // (Reutiliza o DTO que já definimos)

/**
 * Define as rotas de gestão da Empresa (ex: /api/v1/empresa/...).
 * (Migração de routes/empresaRoutes.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Empresa (/empresa)...');

// --- Middlewares Aplicados a Todas as Rotas /empresa ---
router.use(authMiddleware); // 1. Garante autenticação

/**
 * @route   GET /api/v1/empresa/details
 * @desc    Busca os detalhes da empresa (Nome, Endereço, etc.)
 * @access  Privado (Admin)
 * (Migração de)
 * (Nota: O JS original coloca esta lógica em /user/me/empresa,
 * que já migrámos. Esta rota /empresa/details parece ser a preferida
 * para o Admin atualizar.)
 */
router.get(
  '/details',
  adminMiddleware, // 1. Garante que é Admin
  // (Nota: A lógica de getEmpresaDetails foi movida para user.controller.ts)
  // (Se esta rota for *realmente* necessária, ela chama o mesmo controlador)
  empresaController.getEmpresaDetails, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/empresa/details
 * @desc    Atualiza os detalhes da empresa
 * @access  Privado (Admin)
 * (Migração de)
 */
router.put(
  '/details',
  adminMiddleware, // 1. Garante que é Admin
  validate(updateEmpresaSchema), // 2. Valida o body (Zod)
  empresaController.updateEmpresaDetails, // 3. Chama o controlador
);

// (Nota: /api-key e /api-key (POST)
// foram movidos para user.routes.ts em /user/me/empresa/...)

export const empresaRoutes = router;