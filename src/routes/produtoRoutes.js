import { Router } from 'express';
import { listar, obter, criar, atualizar, excluir } from '../controllers/produtoController.js';

const router = Router();

router.get('/', listar);
router.get('/:id', obter);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', excluir);

export default router;
