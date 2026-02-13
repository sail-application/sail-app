# ADR 0001: Next.js 15 with App Router

## Status
Accepted

## Context
The legacy SAIL app uses Vite + React Router v6. We need a framework that supports:
- Server-side rendering for SEO
- API routes for AI and webhook endpoints
- Middleware for auth and security
- Streaming for real-time AI responses
- Docker deployment

## Decision
Use Next.js 15 with the App Router (not Pages Router).

## Rationale
- **SSR/SSG**: Required for SEO and landing pages
- **API Routes**: Eliminates need for separate backend
- **Middleware**: Built-in auth/security enforcement
- **React Server Components**: Reduces client bundle size
- **Streaming**: Native support for AI response streaming
- **Vercel**: First-class deployment target
- **Community**: Largest React framework ecosystem

## Consequences
- Must convert React Router routes to file-based routing
- Must understand Server vs Client component boundary
- Supabase SSR requires cookie-based session management
- Some legacy hooks need refactoring for server/client split
