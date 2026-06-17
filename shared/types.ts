export interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface ChatRequest {
  message: string;
  history?: Message[];
}

export interface AIResponse {
  text: string;
  recommendedProducts?: Product[];
}
