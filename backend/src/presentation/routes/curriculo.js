import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getCurriculo, updateCurriculo } from '../controllers/curriculoController.js';

const router = express.Router();

// GET /api/curriculo — Público, sem autenticação necessária
router.get('/', getCurriculo);

// PUT /api/curriculo — Requer autenticação e perfil admin
router.put('/', authenticate, authorize('admin'), updateCurriculo);

export default router;
