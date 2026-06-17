import { Request, Response } from 'express';
import { fetchProducts } from '../services/dummy.service';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchProducts();
    res.json(data);
  } catch (error) {
    console.error('Error in getProducts controller:', error);
    res.status(500).json({ error: 'Failed to fetch products from DummyJSON' });
  }
};
