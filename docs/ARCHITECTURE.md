# SAIL v2 — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Edge)                      │
│  ┌──────────────────────────────────────────────┐    │
│  │            Next.js 15 App Router              │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────┐  │    │
│  │  │ Middleware  │  │  API Routes │  │ Pages  │  │    │
│  │  │ (auth,CSP) │  │ (AI,hooks) │  │ (SSR)  │  │    │
│  │  └────────────┘  └─────┬──────┘  └────────┘  │    │
│  └─────────────────────────┼─────────────────────┘    │
└────────────────────────────┼──────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  Supabase  │    │  Google AI   │    │  External   │
    │  Postgres  │    │  (Gemini)    │    │  Services   │
    │  Auth      │    │              │    │  Stripe     │
    │  Realtime  │    │  Provider    │    │  Zoho Bigin │
    │  Storage   │    │  Abstraction │    │  ElevenLabs │
    └───────────┘    └──────────────┘    │  Deepgram   │
                                         └─────────────┘
```

## Key Design Decisions

### 1. AI Provider Abstraction
All AI calls route through `lib/ai/provider.ts`. The active provider per feature
is stored in the `ai_provider_config` database table, changeable via admin panel.
This replaces the legacy Lovable AI gateway dependency.

### 2. Auth + Access Gating
Google OAuth → Supabase Auth → Check `authorized_members` table (Skool community
whitelist) → RBAC via `user_roles` table. Three-layer access control.

### 3. Server Components by Default
All pages are React Server Components unless they need interactivity (voice,
real-time updates, form inputs). Client components are explicitly marked with
`'use client'`.

### 4. Glassmorphism Design System
Custom UI components with backdrop-blur effects, semi-transparent backgrounds,
and subtle borders. No shadcn-ui dependency — lean, purpose-built components.

### 5. Tailwind v4 CSS-Based Config
Theme tokens defined in `app/globals.css` using `@theme` blocks instead of
`tailwind.config.ts`. Modern approach scaffolded by Next.js 15.

## Data Flow

### AI Request Flow
1. Client component calls `/api/ai/chat` with messages + feature identifier
2. API route validates auth, rate limits, validates input with Zod
3. `lib/ai/provider.ts` reads config from `ai_provider_config` table
4. Routes to correct provider (Gemini by default)
5. Provider returns response with token counts
6. Usage tracked in `token_usage_logs` (fire-and-forget)
7. Response returned to client

### Auth Flow
1. User clicks "Sign in with Google" → Supabase OAuth
2. Callback route exchanges code for session
3. Check email against `authorized_members` table
4. If not authorized → `/unauthorized` page
5. If authorized → create/update profile, assign role → `/dashboard`
6. Middleware refreshes session on every request

## Security Layers
- **Middleware**: Auth check, security headers, CORS
- **RLS**: Row Level Security on every Supabase table
- **Zod**: Input validation on all API routes
- **Rate Limiting**: In-memory sliding window on AI/webhook routes
- **Webhook Signatures**: Stripe signature validation
- **Audit Logging**: All admin actions tracked
