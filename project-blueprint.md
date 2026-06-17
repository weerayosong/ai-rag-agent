# AI RAG Agent - Project Blueprint

## 1. Project Overview

ระบบ AI RAG (Retrieval-Augmented Generation) แบบ Full-Stack Monorepo สำหรับค้นหาและตอบคำถามเกี่ยวกับสินค้าจาก DummyJSON ผ่านโมเดลภาษา

## 2. Technical Specifications

- **Architecture:** Monorepo (Client, Server, Shared Types)
- **Language:** TypeScript (Strict Mode)
- **Frontend:** React 19, Vite
- **Backend:** Node.js, Express.js
- **Database:** DummyJSON (`[https://dummyjson.com/products](https://dummyjson.com/products)`)
- **AI Engine:** Gemini 3.5 Flash (`@google/genai`)

## 3. UI & Coding Standards

- **Styling:** Tailwind CSS v4 (`@tailwindcss/browser` หรือ `index.css`)
    - Exclusions: `tailwind.config.ts`, PostCSS, Arbitrary Values
    - Requirement: Utility-first approach
- **Icons:** `react-icons`

## 4. Core Capabilities

- **Semantic Search:** Intent-based product retrieval
- **RAG Q&A:** Fact-grounded generation strictly via DummyJSON
- **Structured Output:** Enforced JSON schema response (`AIResponse` interface)
- **Context Memory:** Chat state retention for conversational continuity

## 5. Directory Structure

```text
ai-rag-agent/
├── .gitignore
├── project-blueprint.md
├── architecture.html
├── shared/
│   └── types.ts
├── client/
│   ├── vercel.json
│   ├── .env
│   └── src/
│       ├── index.css
│       ├── App.tsx
│       ├── components/
│       ├── hooks/
│       └── services/
└── server/
    ├── render.yaml
    ├── .env
    └── src/
        ├── index.ts
        ├── routes/
        ├── controllers/
        └── services/

```

## 6. Development Milestones

1. `chore: initial setup` - Monorepo, Vite, Express, Tailwind v4
2. `feat: backend core` - Controllers, Services, DummyJSON integration
3. `feat: ai integration` - Gemini SDK, RAG Pipeline, JSON Output
4. `feat: frontend integration` - UI Components, API connection
5. `style: ui refinement` - Minimalist UI, Loading State, Auto-Scroll

## 7. Deployment Target

- **Client:** Vercel
- **Server:** Render.com
