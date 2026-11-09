import { Router } from 'express';
import { criar, listar, obter } from '../controllers/vendaController.js';

const router = Router();

router.post('/', criar);
router.get('/', listar);
router.get('/:id', obter);

export default router;
