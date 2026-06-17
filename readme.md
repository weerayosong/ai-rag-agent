# [WIP] AI RAG Agent - Smart Product Assistant

Tomorrow marks the graduation day for the JSD12 Bootcamp at Generation Thailand. A huge thank you for their invaluable mentorship and guidance.

Pivoting to software development after 14 years in video production and motion graphics was a massive leap out of my comfort zone. It was a challenging transition, but the growth over these past months has been immeasurable.

This **AI RAG Agent** project serves as my RAG training ground. While I consciously chose to hold off on integrating Vector Embeddings until I fully master the underlying concepts, building this system as an agent orchestrator with Google Antigravity is an incredibly challenge. This isn't the end of the learning curve; it’s just day one for me as a Software Developer. Ready for the next chapter.

![screenshot-img](https://github.com/weerayosong/weerayosong.github.io/blob/main/images/gif/proj8.gif?raw=true)

## Project Overview

**AI RAG Agent** คือโปรเจกต์แอปพลิเคชัน Full-Stack ที่พัฒนาขึ้นในรูปแบบ Monorepo โดยมีจุดประสงค์เพื่อศึกษาและทดลองนำสถาปัตยกรรม **RAG (Retrieval-Augmented Generation)** มาใช้งานจริง ระบบนี้ทำหน้าที่เป็นผู้ช่วยอัจฉริยะสำหรับการค้นหาและตอบคำถามเกี่ยวกับสินค้า, และนี่คือบทเรียนสุดท้าย อันสุดยอดของ Junior Software Developer (Cohort 12) จาก Generation Thailand

หลักการทำงานของระบบคือการรับคำสั่งจากผู้ใช้ (Intent) นำไปดึงข้อมูลสินค้าที่เกี่ยวข้องจากฐานข้อมูลจำลอง (DummyJSON) และส่งข้อมูลเหล่านั้นเป็นบริบท (Context) ให้กับโมเดลภาษาขนาดใหญ่ (LLM) อย่าง Gemini 3.5 Flash เพื่อประมวลผลและตอบกลับมาเป็นโครงสร้างข้อมูล (Structured JSON) ที่หน้าบ้านสามารถนำไปแสดงผลได้อย่างแม่นยำและลดปัญหาการให้ข้อมูลผิดพลาด (Hallucination)

## System Design & Software Architecture

[Documentation](https://thunderous-bubblegum-88c466.netlify.app/)

## Technology Stack

**Frontend (Client)**

- **Core:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS v4

**Backend (Server)**

- **Core:** Node.js, Express.js, TypeScript
- **AI Engine:** Gemini 3.5 Flash (`@google/genai` SDK)
- **External Data:** DummyJSON API

## Core Features & Capabilities

- **Semantic Product Search:** ก้าวข้ามการค้นหาแบบ Keyword ดั้งเดิม ระบบสามารถเข้าใจบริบทและความต้องการของผู้ใช้ผ่านภาษาธรรมชาติ
- **RAG-Powered Q&A:** คำตอบทั้งหมดของ AI จะถูกกำหนดให้อ้างอิงจากข้อมูลสินค้าของ DummyJSON เท่านั้น เพื่อความน่าเชื่อถือและป้องกันข้อมูลเท็จ
- **Structured JSON Rendering:** บังคับให้ AI ตอบกลับมาในรูปแบบ JSON ตาม Interface ที่กำหนด (`AIResponse`) เพื่อให้ Frontend นำไปเรนเดอร์เป็นการ์ดสินค้าได้อย่างสมบูรณ์
- **Context-Aware Memory:** ระบบมีการจัดการ State เพื่อจดจำประวัติการสนทนา ทำให้ผู้ใช้สามารถสั่งงานและถามคำถามต่อเนื่องได้

## Directory Structure

โครงสร้างโปรเจกต์ถูกออกแบบมาให้แยกสัดส่วนความรับผิดชอบ (Separation of Concerns) อย่างชัดเจน:

```text
ai-rag-agent/
├── shared/                 # โฟลเดอร์เก็บ TypeScript Interfaces ที่ใช้ร่วมกัน
│   └── types.ts
├── client/                 # ส่วนประกอบของ Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # UI Components (Dumb Components)
│   │   ├── hooks/          # Custom Hooks สำหรับจัดการ State
│   │   └── services/       # API Client สำหรับสื่อสารกับ Backend
│   └── index.css           # ตั้งค่า Tailwind CSS v4
└── server/                 # ส่วนประกอบของ Backend (Express)
    └── src/
        ├── routes/         # กำหนด API Endpoints
        ├── controllers/    # จัดการ Request/Response และ Validation
        └── services/       # Business Logic (RAG Pipeline, Gemini AI)
```
