import { Router } from 'express';
import { placaController } from '@/api/controllers/src/placa.controller';
import { logger } from '@/config/logger';

// Middlewares
import { authMiddleware } from '@/security/middlewares/auth.middleware';
import { adminMiddleware } from '@/security/middlewares/admin.middleware'; // (Gestão de placas é Admin)
import { validate } from '@/security/middlewares/validate.middleware';
import { upload } from '@/security/middlewares/upload.middleware'; // Importa o Multer

// Validadores Zod (DTOs)
import {
  placaBodySchema,
  updatePlacaSchema,
  listPlacasSchema,
  checkDisponibilidadeSchema,
} from '@/utils/validators/placa.validator';
import { mongoIdParamSchema } from '@/utils/validators/admin.validator';

/**
 * Define as rotas de gestão de Placas (ex: /api/v1/placas/...).
 * (Migração de routes/placas.js)
 */

const router = Router();

logger.info('[Routes] Definindo rotas de Placas (/placas)...');

// --- Middlewares Aplicados a Todas as Rotas /placas ---
// (Lógica do JS original)
router.use(authMiddleware);
// (Nota: A gestão de placas deve ser restrita a Admins)
router.use(adminMiddleware);

/**
 * @route   GET /api/v1/placas/locations
 * @desc    Busca todas as localizações (coordenadas)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.get(
  '/locations',
  placaController.getPlacaLocations, // 1. Chama o controlador
);

/**
 * @route   GET /api/v1/placas/disponiveis
 * @desc    Busca placas disponíveis por período (e filtros)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.get(
  '/disponiveis',
  validate(checkDisponibilidadeSchema), // 1. Valida query params (Zod)
  placaController.getPlacasDisponiveis, // 2. Chama o controlador
);

/**
 * @route   GET /api/v1/placas
 * @desc    Busca todas as placas (com filtros e paginação)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.get(
  '/',
  validate(listPlacasSchema), // 1. Valida query params (Zod)
  placaController.getAllPlacas, // 2. Chama o controlador
);

/**
 * @route   POST /api/v1/placas
 * @desc    Cria uma nova placa (com upload)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.post(
  '/',
  upload.single('imagem'), // 1. Middleware Multer
  validate(placaBodySchema), // 2. Valida o body (Zod)
  placaController.createPlaca, // 3. Chama o controlador
);

/**
 * @route   GET /api/v1/placas/:id
 * @desc    Busca uma placa por ID
 * @access  Privado (Admin)
 * (Migração de)
 */
router.get(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  placaController.getPlacaById, // 2. Chama o controlador
);

/**
 * @route   PUT /api/v1/placas/:id
 * @desc    Atualiza uma placa existente (com upload)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.put(
  '/:id',
  upload.single('imagem'), // 1. Middleware Multer
  validate(updatePlacaSchema), // 2. Valida o body e params (Zod)
  placaController.updatePlaca, // 3. Chama o controlador
);

/**
 * @route   DELETE /api/v1/placas/:id
 * @desc    Apaga uma placa
 * @access  Privado (Admin)
 * (Migração de)
 */
router.delete(
  '/:id',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  placaController.deletePlaca, // 2. Chama o controlador
);

/**
 * @route   PATCH /api/v1/placas/:id/disponibilidade
 * @desc    Alterna status de disponibilidade (manutenção)
 * @access  Privado (Admin)
 * (Migração de)
 */
router.patch(
  '/:id/disponibilidade',
  validate(mongoIdParamSchema), // 1. Valida o :id (Zod)
  placaController.toggleDisponibilidade, // 2. Chama o controlador
);

export const placaRoutes = router;