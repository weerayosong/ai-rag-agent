import { Request, Response } from 'express';
import { fetchProducts } from '../services/dummy.service';
import { processChatWithGemini } from '../services/gemini.service';
import { ChatRequest } from 'shared';

const responseCache = new Map<string, any>();

export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body as ChatRequest;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const cacheKey = message.trim().toLowerCase();
    if (responseCache.has(cacheKey)) {
      res.json(responseCache.get(cacheKey));
      return;
    }

    // 1. Fetch raw products from DummyJSON
    const rawProducts = await fetchProducts();
    const productsList = rawProducts.products || rawProducts;

    const optimizedProducts = productsList.map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      category: product.category,
      thumbnail: product.thumbnail,
      description: product.description,
    }));

    // 2. Process with Gemini
    const aiResponse = await processChatWithGemini(message, optimizedProducts);

    responseCache.set(cacheKey, aiResponse);

    // 3. Return strictly typed JSON
    res.json(aiResponse);
  } catch (error: any) {
    console.error('Error in chat controller:', error);
    
    if (error.message && error.message.startsWith('RATE_LIMIT:')) {
      const [prefixAndSeconds, ...rest] = error.message.split('|');
      const seconds = prefixAndSeconds.split(':')[1];
      res.status(429).json({ error: `ขออภัยด้วยนะคะคุณลูกค้า ตอนนี้คิวชำระเงินยาวนิดนึง รบกวนรอประมาณ ${seconds} วินาที แล้วลองสอบถามหนูใหม่อีกครั้งนะคะ 🙇‍♀️🏪` });
      return;
    }
    
    if (error.message && (error.message.includes('503') || error.message.includes('UNAVAILABLE'))) {
      res.status(503).json({ error: 'ขออภัยค่ะ ตอนนี้ลูกค้าในร้านเยอะมาก คิวชำระเงินยาวเลย รบกวนคุณลูกค้ารอสักครู่แล้วลองสอบถามใหม่อีกครั้งนะคะ 🏪' });
      return;
    }
    
    res.status(500).json({ error: 'ขออภัยค่ะ ระบบแคชเชียร์มีปัญหาขัดข้องเล็กน้อย รบกวนคุณลูกค้าลองใหม่อีกครั้งนะคะ 🙇‍♀️' });
  }
};
