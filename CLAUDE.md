# SAIL — Sales AI Learning Platform

## What
Next.js 15 (App Router) web app for training volume photographers in sales. Built on Vercel + Supabase. Trains users using Paul Cherry's "Questions That Sell" methodology (Sure → Want To → Have To).

## Business Context
- **Company:** SA Picture Day — volume photography business in San Antonio, TX
- **Owner:** Alex — experienced IT leader, not a developer. All code must be written with that in mind.
- **Target market:** Dance studios (highest priority — 90+ researched in SA area), schools, daycares, sports organizations
- **Prospect profile:** Businesses with active online presence, hosting events/recitals/picture days/group activities, San Antonio metro area (unless told otherwise)
- **Community:** SA Picture Day Skool group — SAIL is gated to Skool members only

## Stack
- **Framework:** Next.js 15 App Router, TypeScript strict, React 19
- **Styling:** Tailwind CSS + glassmorphism design system
- **Database:** Supabase (Postgres + Auth + Realtime + RLS + Storage)
- **AI:** Google Gemini (primary), with provider-agnostic abstraction layer
- **Voice:** Web Speech API (STT), ElevenLabs / Google Cloud TTS
- **Hosting:** Vercel (production on `main`, preview on PRs)
- **Payments:** Stripe
- **CRM:** Zoho Bigin (all lead/contact management)
- **Analytics:** Vercel Analytics, GA4, PostHog, Sentry

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run test` — Run tests
- `make verify` — Docker clean-build test
- `make docker-up` / `make docker-down` — Local full stack
- `npx supabase db push` — Push migrations to Supabase
- `npx supabase migration new <n>` — Create new migration

## Architecture
```
/app                    → Pages and layouts (App Router)
  /app/(auth)           → Login, signup flows
  /app/(dashboard)      → Protected app routes
  /app/api              → API routes (AI, webhooks, integrations)
/components
  /components/ui        → Reusable UI primitives
  /components/features  → Feature-specific components
/lib
  /lib/ai              → AI provider abstraction layer
  /lib/supabase        → Supabase client + server helpers
  /lib/integrations    → Zoho, Stripe, Skool, ElevenLabs
  /lib/hooks           → Custom React hooks
/infrastructure        → Terraform IaC (Vercel + Supabase)
/docker                → Dockerfile, docker-compose files
/supabase
  /supabase/migrations → SQL migration files (sequential timestamps)
  /supabase/functions  → Edge Functions (background workers)
  /supabase/seed.sql   → Dev seed data
/.github/workflows     → CI/CD pipelines
/types                 → Shared TypeScript types
/docs
  /docs/prd            → Product Requirements Documents
  /docs/ux             → UX Specifications + mockups
  /docs/adr            → Architecture Decision Records
/__tests__             → Unit, integration, E2E tests
/scripts               → Setup, verify, seed scripts
```

## Infrastructure
- **IaC:** Terraform manages Vercel project + Supabase settings
- **CI/CD:** GitHub Actions → lint + typecheck + test + build + Docker verify
- **Background Workers:** Supabase Edge Functions + pg_cron scheduling
- **Job Queue:** `background_jobs` table + pgmq for on-demand tasks
- **Containers:** Docker for local full-stack dev + CI verification (NOT for production — Vercel handles that)

## Core Features (6)
1. **Live Call Assistant** — Real-time coaching during active calls. Sub-2s latency. Gemini Flash.
2. **Practice Mode** — AI roleplay with click-to-talk, split-screen coach tips, 10-level progress.
3. **Email Composition** — AI-assisted prospect outreach drafting. Gemini Pro.
4. **Call Analyzer** — Post-call upload, scorecards, improvement suggestions. Gemini Pro.
5. **Strategies Library** — Searchable Paul Cherry methodology techniques.
6. **Dashboard** — Unified progress, activity, metrics overview.

## AI Architecture
- Provider-agnostic abstraction: all AI calls go through `/lib/ai/provider.ts`
- Each feature has a configurable provider in admin panel (Gemini/Claude/OpenAI/DeepSeek)
- Real-time features → Gemini 2.0 Flash; Analytical features → Gemini 2.5 Pro
- Token usage tracked per feature for cost dashboard

## Auth Flow
Google OAuth → Supabase Auth → Check `authorized_members` table (Skool community gating) → RBAC roles (admin, team_lead, rep)

## Integrations

### Zoho Bigin CRM
- Primary CRM for all lead and contact management
- API docs: https://www.bigin.com/developer/docs/apis/
- New leads created as Contacts or Pipeline records (confirm which module with user)
- **NEVER overwrite existing CRM records without asking.** When a match is found, present the conflict and ask how to proceed.

### Other Integrations
- Stripe — subscription payments
- Skool — community member sync (access gating)
- ElevenLabs — AI voice synthesis
- Deepgram / Google Cloud STT — speech-to-text
- Resend — transactional emails
- MorphCast — facial emotion AI (future)

### Future Integrations (not yet active)
- Hunter.io — email discovery
- Google Sheets — data import/export
- Twilio — call recording/phone integration

## Design Principles
- **Glanceable:** Cockpit-style panels, digestible in <2 seconds during calls
- **Glassmorphism:** Consistent visual language throughout
- **Auto-capture:** Generate insights from interactions, never require manual entry
- **Mobile-first:** PWA-ready, responsive across all breakpoints
- **Accessible:** WCAG 2.1 AA compliance

## Code Standards (Priority Order)
1. **Production-ready with error handling** — Every API call, file operation, and external dependency must have try/catch. Fail gracefully with clear error messages.
2. **Heavily commented** — Comment every function, explain the "why" not just the "what." Assume the reader understands IT concepts but not programming patterns.
3. **Simple and low-complexity** — Prefer straightforward, readable code over clever abstractions. Flat > nested. Fewer files > many. If simpler works, use it.
4. **Future-aware** — Before architectural decisions, briefly explain tradeoffs and ask if user wants simple now or scalable. Default to simple.

### Documentation Requirements
- Every module must include a `README.md` explaining: what it does, how to set it up, how to run it, and what env vars it needs.
- When creating new files, include a comment block at the top explaining the file's purpose.

## Permissions and Safety Rules

### Always Ask Before:
- Sending emails or messages to real people
- Deleting or overwriting existing CRM records
- Any irreversible operation (database drops, bulk deletes, etc.)
- Spending money (paid API calls beyond free tiers)

### Override Mode:
If user says **"proceed without warnings"** or similar, skip confirmations. Applies only to current task/session.

### Dry Run Mode:
Every tool must support a dry run flag that simulates the full workflow without writing to production systems (no CRM writes, no emails, no external changes). Dry run is the default first run.

### Default Permissions:
- **Read:** Full access to all modules, integrations, and data
- **Write:** Full access — create files, records, configs as needed
- **Delete/Overwrite:** Ask first (unless override mode is active)

## Mandatory Workflow
1. **Plan Mode first** — ALWAYS analyze before writing code (Shift+Tab twice)
2. **PRD before code** — Every feature gets `docs/prd/[name].md` before implementation
3. **UX spec for UI** — Every UI feature gets `docs/ux/[name].md` + optional HTML mockup
4. **MVP-first** — If feature needs >1 week or >3 tables, break into smaller increments
5. **ADR for decisions** — Major architecture choices go in `docs/adr/NNNN-title.md`
6. **Docker verify** — Run `make verify` (Docker clean-build) before marking features complete
7. **Proactively refactor** — Suggest refactoring when code smells or better alternatives exist
8. **Pivot when needed** — Recommend simpler alternatives if current approach has friction

## File Size Rule
- **No file > 200 lines.** Split into smaller modules proactively.
- Extract hooks to `/lib/hooks/`, utils to `/lib/utils/`, types to `/types/`
- Suggest refactoring at 150 lines (warn), mandatory split at 200

## QA Checklist — Required for Every Task

### Security
- Scan for hardcoded credentials — flag and fix immediately
- Validate all user inputs are sanitized (no injection vulnerabilities)
- Verify `.env` and sensitive files are in `.gitignore`
- Check dependencies for known vulnerabilities (`npm audit` / `pip audit`)
- Ensure API calls use HTTPS and proper authentication
- Review file permissions — no unnecessary write access

### Code Validation
- Lint all code (`eslint` for TS/JS, `ruff`/`flake8` for Python)
- Verify all imports resolve and no unused dependencies exist
- Confirm env vars are documented and validated at startup (fail fast if missing)
- Check consistent naming conventions and code style

### Debugging
- Run the code and verify it executes without errors
- Test error handling paths — simulate API failures, missing config, bad data
- Verify logging is in place for key operations
- Confirm graceful degradation — failure in one step must not crash the whole tool

### Testing
- Test with sample/mock data before touching real systems
- Edge cases: empty inputs, duplicate records, API rate limits, malformed data

### QA Report (provide after every task)
- ✅ Security: [pass/issues]
- ✅ Lint: [pass/issues]
- ✅ Runs without errors: [pass/fail]
- ✅ Error handling tested: [pass/fail]
- ✅ Dry run successful: [pass/fail]
- ⚠️ Known limitations or areas to watch

## Critical Rules
- NEVER commit `.env` or `.env.local` files
- ALL Supabase schema changes MUST use migration files
- ALL API keys go through environment variables, never hardcoded
- RLS policies required on every table — no exceptions
- Stripe webhook handlers MUST validate signatures
- Every new API route needs rate limiting via middleware
- Use server components by default; client components only when needed
- For SEO: use Next.js Metadata API, JSON-LD structured data, semantic HTML
- CI must pass (lint + typecheck + test + build) before any merge
- Check existing code before creating new files — avoid duplication

## Git Workflow
- `main` → production (auto-deploys to Vercel)
- `staging` → QA/testing
- Feature branches → `feature/[name]` → PR to staging → merge to main
- Commit format: `type(scope): description` (e.g., `feat(practice-mode): add progress bar`)
- Branch naming: `feature/lead-gen-v1`, `fix/bigin-auth-error`, `docs/setup-guide`

## Related Repo
The CRM automation engine (lead generation, prospect enrichment) lives in a separate repo: `sail-crm-engine/`. That repo uses Python for API integrations and data processing. This SAIL platform (Next.js) connects to the same Zoho Bigin CRM and may consume data from that engine.

## Getting Started (for Claude Code sessions)
1. Check if dependencies are installed; if not, set up the environment
2. Read this CLAUDE.md for context
3. Check existing code in the repo before creating new files — avoid duplication
4. Ask clarifying questions early rather than making assumptions
5. When task is done, provide a clear summary of: what was built, how to run it, and what's left to do

AI suggestion prompts must be methodology-aware. The active methodologies for a user are read from the methodologies table. Never hardcode Paul Cherry as the only framework.
