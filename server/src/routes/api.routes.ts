import { Router } from 'express';
import { getProducts } from '../controllers/product.controller';
import { chatWithAI } from '../controllers/chat.controller';

const router = Router();

router.get('/products', getProducts);
router.post('/chat', chatWithAI);

export default router;
