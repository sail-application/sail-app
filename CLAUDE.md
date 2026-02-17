# SAIL — Sales AI Learning Platform

## What
Next.js 15 (App Router) universal conversation coaching platform. Built on Vercel + Supabase. Helps professionals improve communication skills across any industry — from B2B sales to negotiations to parenting. Strategies/methodologies are modular and can be toggled on/off per session.

## Business Context
- **Company:** SA Picture Day — volume photography business in San Antonio, TX
- **Owner:** Alex — experienced IT leader, not a developer. All code must be written with that in mind.
- **Target market:** Sales professionals, negotiators, managers, educators — anyone who needs structured conversation coaching. Current focus: SA Picture Day volume photography team (original use case), plus any business professional wanting to sharpen communication.
- **Prospect profile (for SA Picture Day):** Businesses with active online presence, hosting events/recitals/picture days/group activities, San Antonio metro area (unless told otherwise)
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
1. **Live Call Assistant** — Real-time coaching during active conversations. Sub-2s latency. Gemini Flash.
2. **Practice Mode** — AI roleplay with coaching tips, scenario selection, multi-methodology support.
3. **Email Composition** — AI-assisted outreach drafting for any industry. Gemini Pro.
4. **Call Analyzer** — Post-call upload, scorecards, improvement suggestions. Gemini Pro.
5. **Strategies Library** — Browse and manage active coaching methodologies (BANT, MEDPIC, Paul Cherry, etc.).
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

## Agent Creation Strategy

### When to Suggest Building Agents
Proactively recommend building specialized agents when encountering:

**Large Tasks (>4 hours or >3 files affected):**
- Building new major features (billing system, CRM integrations, multi-step workflows)
- Complex migrations (database schema changes, data transformations)
- Cross-cutting changes (adding security layer, analytics tracking across features)

**Repetitive Tasks (will be done 3+ times):**
- Database migrations and schema changes
- Creating new feature pages following SAIL patterns
- Testing workflows before each deploy
- Methodology content creation (JSONB structures)
- Integration debugging (external APIs)
- Performance audits and optimization

**Domain-Specific Work:**
- AI prompt engineering and testing across methodologies
- Sales content generation (emails, practice scenarios)
- CRM data operations (enrichment, deduplication, sync)

### Agent Proposal Workflow

**MANDATORY: Always get approval before building agents**

When identifying an agent opportunity:

1. **Stop and Propose** — Don't start the task yet
2. **Present Agent Specification:**
   ```
   🤖 Agent Recommendation: [Name]

   Purpose: [What problem does it solve]

   Capabilities:
   - [Specific task 1]
   - [Specific task 2]
   - [Specific task 3]

   Time Savings: [X hours per use]

   Will be used for:
   - [Immediate use case]
   - [Future use case 1]
   - [Future use case 2]

   Build time: [Estimated hours]

   Alternative: [What we'd do manually without the agent]
   ```

3. **Wait for User Decision:**
   - ✅ "Build it" → Proceed with agent creation
   - ❌ "Skip it, do manually" → Execute task without agent
   - 🤔 "Tell me more" → Provide additional details

4. **Never Assume Approval** — Even if task is perfect for an agent, always ask first

### SAIL-Specific Agent Types

**High-Value Agents for This Project:**

1. **Supabase Migration Agent**
   - Creates timestamped migration files
   - Generates RLS policies automatically
   - Writes indexes and constraints
   - Updates TypeScript types
   - Validates syntax before push
   - *Use frequency: Multiple times per week*

2. **Feature Builder Agent**
   - Scaffolds new dashboard pages
   - Creates API routes with Zod validation
   - Adds to navigation and routing
   - Implements glassmorphism design
   - Sets up AI provider configs
   - Adds usage tracking hooks
   - *Use frequency: Each new feature*

3. **Methodology Builder Agent**
   - Interviews user about sales methodology
   - Generates JSONB structures (scoring_rubric, stages, vocabulary, etc.)
   - Creates migration seed file
   - Validates against schema
   - Generates test scenarios
   - *Use frequency: Each new methodology (3-10 per quarter)*

4. **AI Prompt Testing Agent**
   - Tests prompts across all methodologies
   - Validates 5-layer system prompt composition
   - Runs A/B tests on variations
   - Measures quality, latency, cost
   - Tests with different user personas
   - *Use frequency: Each prompt change, feature addition*

5. **End-to-End Tester Agent**
   - Runs critical user flows (auth, features, billing)
   - Tests across browsers and devices
   - Validates API responses and RLS policies
   - Generates test reports with screenshots
   - *Use frequency: Before every production deploy*

6. **Integration Debugger Agent**
   - Tests external API endpoints (Stripe, Zoho, Deepgram, Gemini)
   - Validates webhook signatures
   - Reproduces integration errors
   - Monitors integration health
   - *Use frequency: When integrations fail or during new integration setup*

7. **Performance Auditor Agent**
   - Runs Lighthouse audits
   - Analyzes database query performance
   - Measures API response times
   - Calculates COGS per feature
   - Identifies expensive AI calls
   - *Use frequency: Monthly or when users report slowness*

### Agent Approval Example

❌ **Bad (No Approval):**
```
User: "Add billing tables to the database"
AI: [Immediately starts building migration agent without asking]
```

✅ **Good (With Approval):**
```
User: "Add billing tables to the database"

AI: "I can create these tables manually, or we could build a Supabase
     Migration Agent that would handle this and all future schema changes.

     The agent would:
     - Generate migration files with proper RLS policies
     - Create indexes automatically
     - Update TypeScript types
     - Validate syntax before pushing

     Build time: ~30 minutes
     Time saved per use: ~30-60 minutes

     You'll need this agent for billing tables now, and for every schema
     change going forward (dozens of times).

     Should I build the agent first, or handle this migration manually?"

User: "Build the agent"

AI: [Proceeds with agent creation, then uses it for the billing tables]
```

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
