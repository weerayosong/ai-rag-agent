import { Request, Response } from 'express';
import { fetchProducts } from '../services/dummy.service';
import { processChatWithGemini } from '../services/gemini.service';
import { ChatRequest } from 'shared';

export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body as ChatRequest;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
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

    // 3. Return strictly typed JSON
    res.json(aiResponse);
  } catch (error: any) {
    console.error('Error in chat controller:', error);
    
    if (error.message && error.message.startsWith('RATE_LIMIT:')) {
      const [prefixAndSeconds, ...rest] = error.message.split('|');
      const seconds = prefixAndSeconds.split(':')[1];
      const rawMessage = rest.join('|');
      res.status(429).json({ error: `โควต้า API เต็มชั่วคราว (รอ ${seconds} วิ) | สาเหตุจริง: ${rawMessage}` });
      return;
    }
    
    res.status(500).json({ error: `เซิร์ฟเวอร์ขัดข้อง: ${error.message}` });
  }
};
