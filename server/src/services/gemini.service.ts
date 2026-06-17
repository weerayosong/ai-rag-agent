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
You are a helpful and knowledgeable Product Assistant for an e-commerce platform.
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
  } catch (error) {
    console.error('Error in Gemini Service:', error);
    throw new Error('Failed to generate response from AI');
  }
};
