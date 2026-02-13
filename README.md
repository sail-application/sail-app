# SAIL — Sales AI Learning Platform

AI-powered sales training for volume photographers. Built on Next.js 15, Supabase, and Google Gemini. Uses Paul Cherry's "Questions That Sell" methodology to train sales reps in consultative selling.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your actual API keys in .env.local

# Start dev server
npm run dev

# Open http://localhost:3000
```

## Tech Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript strict)
- **Styling:** Tailwind CSS v4 + glassmorphism design system
- **Database:** Supabase (Postgres, Auth, Realtime, RLS, Storage)
- **AI:** Google Gemini (provider-agnostic abstraction layer)
- **Voice:** Deepgram STT + ElevenLabs TTS
- **Hosting:** Vercel
- **Payments:** Stripe
- **CRM:** Zoho Bigin

## Core Features

1. **Live Call Assistant** — Real-time coaching during active sales calls
2. **Practice Mode** — AI roleplay with prospect personas
3. **Email Composition** — AI-assisted prospect outreach drafting
4. **Call Analyzer** — Post-call upload and AI analysis
5. **Strategies Library** — Paul Cherry methodology reference
6. **Dashboard** — Unified progress and metrics

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `make verify` | Docker clean-build test |
| `make docker-up` | Start local full stack |
| `make docker-down` | Stop local stack |

## Project Structure

```
app/              → Pages and layouts (App Router)
  (auth)/         → Login, signup, OAuth callback
  (dashboard)/    → Protected app routes (6 features)
  (admin)/        → Admin panel (AI config, users, costs)
  api/            → API routes (AI, webhooks)
components/       → React components
  ui/             → Design system primitives (glassmorphism)
  layout/         → Sidebar, header, mobile nav
  providers/      → Context providers (Supabase, theme, analytics)
lib/              → Shared libraries
  ai/             → AI provider abstraction layer
  supabase/       → Database client helpers
  utils/          → Utilities (cn, rate-limit, validators)
  hooks/          → Custom React hooks
types/            → TypeScript type definitions
supabase/         → Migrations, seed data, config
docs/             → Architecture docs, ADRs, PRDs
```

## Environment Variables

See `.env.example` for all required variables. Key services:
- Supabase (database + auth)
- Google Gemini (AI)
- Stripe (payments)
- ElevenLabs (voice)
- Deepgram (speech-to-text)
- Zoho Bigin (CRM)

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Legacy Analysis](docs/LEGACY_ANALYSIS.md)
- [ADR: Next.js 15](docs/adr/0001-nextjs-15-app-router.md)
- [ADR: AI Abstraction](docs/adr/0002-ai-provider-abstraction.md)

## License

See [LICENSE](LICENSE) for details.
