# General Development AI Chatbot Template

A Next.js 14 template with AI chat + RAG capabilities, built for General Development's internal projects.

## Tech Stack

- Next.js 14 with App Router
- Supabase (local dev + production)
- Drizzle ORM
- shadcn/ui components
- AI SDK for LLM integration
- Auth.js for authentication

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Start Supabase locally:

```bash
supabase start
```

3. Start the development server:

```bash
pnpm dev
```

Visit [localhost:3000](http://localhost:3000) to see your app.

## Development Rules

1. Use `pnpm` for all package management
2. Follow the App Router structure in `app/` directory
3. Use shadcn components for UI consistency
4. Implement loading states for all async operations
5. Display backend responses in the UI
6. Use Drizzle for DB operations
7. Use Pinecone for vector databases
8. Use Vercel AI SDK for AI operations

---

General Development
