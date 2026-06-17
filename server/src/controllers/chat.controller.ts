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

    // 2. Process with Gemini
    const aiResponse = await processChatWithGemini(message, productsList);

    // 3. Return strictly typed JSON
    res.json(aiResponse);
  } catch (error) {
    console.error('Error in chat controller:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
