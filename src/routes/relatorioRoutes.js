import { Router } from 'express';
import { relatorioVendas } from '../controllers/relatorioController.js';

const router = Router();

router.get('/vendas', relatorioVendas);

export default router;
