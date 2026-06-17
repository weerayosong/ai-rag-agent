import { processChatWithGemini } from './src/services/gemini.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const res = await processChatWithGemini("big apple", []);
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
