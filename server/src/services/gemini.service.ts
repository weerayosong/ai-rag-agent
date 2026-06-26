import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AIResponse } from 'shared';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: 'The response text answering the user, acting as a helpful product assistant.',
    },
    recommendedProducts: {
      type: Type.ARRAY,
      description: 'A list of recommended products based on the user request and DummyJSON data. Only include if relevant.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          title: { type: Type.STRING },
          price: { type: Type.NUMBER },
          category: { type: Type.STRING },
          thumbnail: { type: Type.STRING },
        },
        required: ['id', 'title', 'price', 'category', 'thumbnail'],
      },
    },
  },
  required: ['text'],
};

export const processChatWithGemini = async (userMessage: string, productsData: any): Promise<AIResponse> => {
  const systemInstruction = `
You are a helpful, knowledgeable, and friendly female Product Assistant for an e-commerce platform.
You must always communicate in Thai using a polite female persona. 
Always use "หนู" to refer to yourself and end your sentences with "ค่ะ" or "คะ" appropriately.
DO NOT use male particles like "ครับ" or "ผม".
ให้คุณรับบทเป็นพนักงานร้านสะดวกซื้อที่กระตือรือร้น เป็นมิตร และพร้อมบริการเสมอ สามารถสอดแทรกคำพูดติดปากของพนักงานร้านสะดวกซื้อ (เช่น 'รับ...เพิ่มไหมคะ', 'สวัสดีค่ะ ยินดีต้อนรับค่ะ', 'โอกาสหน้าเชิญใหม่นะคะ') ลงไปในการแนะนำสินค้าให้ดูเป็นธรรมชาติ
Your task is to answer user queries and recommend products strictly based on the provided DummyJSON product data.
DO NOT hallucinate or invent products, prices, or details that are not in the provided data.
If the user asks for something that doesn't exist in the data, politely inform them that you couldn't find a matching product.

Available Product Data:
${JSON.stringify(productsData, null, 2)}
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature to minimize hallucination
      },
    });

    if (!response.text) {
      throw new Error('No text returned from Gemini API');
    }

    const aiResponse: AIResponse = JSON.parse(response.text);
    return aiResponse;
  } catch (error: any) {
    console.error('RAW GEMINI ERROR:', JSON.stringify(error, null, 2), error.message);
    
    // Check for rate limit error (429)
    if (error.status === 429 || (error.message && error.message.includes('Quota exceeded'))) {
      const match = error.message ? error.message.match(/retry in ([\d.]+)s/i) : null;
      const seconds = match ? Math.ceil(parseFloat(match[1])) : 60; // Default to 60s if not found
      throw new Error(`RATE_LIMIT:${seconds}|${error.message}`);
    }
    
    throw new Error(`AI_ERROR:${error.message}`);
  }
};
