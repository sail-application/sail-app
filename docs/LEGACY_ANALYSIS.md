# Legacy Codebase Analysis — my8ball

> Source: https://github.com/sail-application/my8ball
> Analyzed: 2026-02-13
> Purpose: Document the existing SAIL codebase to inform the v2 migration

## Overview

The legacy SAIL app is a **Vite + React 18 + TypeScript** single-page application hosted on Lovable.dev. It uses React Router v6 for routing, Tailwind CSS + shadcn-ui (48 Radix components) for styling, and Supabase for auth/database/realtime. All AI features route through Lovable's proprietary AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`), which is the primary migration blocker.

**Supabase project ID (legacy):** `qhoqhbkydcwxbqnngoob`

---

## Technology Stack

| Layer | Legacy | SAIL v2 |
|-------|--------|---------|
| Framework | Vite + React Router v6 | Next.js 15 App Router |
| AI Provider | Lovable AI Gateway | Google Gemini (provider-agnostic) |
| Styling | Tailwind + shadcn-ui (48 components) | Tailwind v4 + custom glassmorphism |
| Database | Supabase (Lovable-managed) | Supabase (self-managed) |
| Auth | Supabase Google OAuth | Supabase Google OAuth + Skool gating |
| Voice | Deepgram STT + ElevenLabs TTS | Same + Google Cloud fallbacks |
| Hosting | Lovable Cloud | Vercel |
| CRM | Local `clients` table | Zoho Bigin integration |
| Payments | None | Stripe |

---

## Database Schema (8 tables)

### Core Tables

1. **email_conversations** — Stores email composition chat history
   - `id` UUID PK, `user_id` UUID FK, `title` TEXT, `messages` JSONB, `draft_email` TEXT, `previous_communication` TEXT, `uploaded_files_content` TEXT, `created_at`, `updated_at`
   - RLS: Users CRUD own records + anonymous access for demo

2. **call_history** — Live call recordings and post-call analysis
   - `id` UUID PK, `user_id` UUID FK, `duration` INTEGER (seconds), `transcript` TEXT, `summary` JSONB, `suggestions` JSONB, `pinned_insights` JSONB, `score` NUMERIC, `follow_up_email` TEXT, `created_at`, `updated_at`
   - Indexes on `user_id` + `created_at`
   - RLS: User-scoped

3. **user_notes** — Notes linked to calls
   - `id` UUID PK, `user_id` UUID FK, `title`, `content`, `source`, `starred` BOOLEAN, `segment`, `skill`, `call_type`, `ai_insight`, `linked_call_id` FK→call_history, `linked_call_name`, `last_viewed_at`, `created_at`, `updated_at`
   - RLS: User-scoped

4. **notes** — Shared collaborative notepad (public, ID-based)
   - `id` TEXT PK (not UUID), `content`, `allow_editing` BOOLEAN, `password_hash`, `expires_at`, `is_deleted`, `created_at`, `updated_at`
   - RLS: Public read if not expired/deleted
   - Realtime enabled (Y.js CRDTs)

5. **transcriptions** — Call analyzer historical transcriptions
   - `id` UUID PK, `client_id` FK→clients, `source_type`, `transcription_text`, `analysis_result` JSONB, `coaching_insights` JSONB, `follow_up_email`, `call_date`, `created_at`

6. **clients** — Basic CRM contacts
   - `id` UUID PK, `crm_id` TEXT UNIQUE, `client_name`, `rep_name`, `created_at`, `updated_at`

### Admin Tables

7. **user_roles** — RBAC (enum: admin, user)
   - `id` UUID PK, `user_id` FK→auth.users, `role` app_role enum, `created_at`
   - Uses `has_role()` SECURITY DEFINER function to avoid recursive RLS
   - Seeded with alex@sapicture.day as admin

8. **app_settings** — Key-value config store
   - `id` UUID PK, `category`, `key` (UNIQUE per category), `value` JSONB, `label`, `description`, `updated_at`, `updated_by`
   - Categories: transcription, practice, live_call, community, api_status, features
   - RLS: All authenticated can read, admins write

9. **activity_logs** — Admin audit trail
   - `id` UUID PK, `user_id`, `user_email`, `action`, `category`, `details` JSONB, `severity`, `created_at`
   - RLS: Admins only

### Custom Functions & Triggers
- `has_role(_user_id, _role)` — SECURITY DEFINER function for RLS
- `update_updated_at_column()` — Auto-update trigger on clients, email_conversations, call_history, app_settings

---

## Edge Functions (8 Supabase Deno functions)

All functions use `verify_jwt = false` and call the **Lovable AI gateway** (`LOVABLE_API_KEY`).

1. **live-call-analysis** — Real-time coaching during active calls. Detects lock-on opportunities, "we" detector, pain points, talk ratio, stage assessment, objections. Returns suggestions array + summary.

2. **analyze-call** — Post-call analysis with Paul Cherry power questions database. Question quality scoring, talk ratio analysis. Supports Spanish.

3. **practice-mode** — AI roleplay with persona profiles (principal, administrator, dance, daycare, sports). Difficulty levels (easy/medium/hard). Supports English + Spanish.

4. **generate-email-chat** — AI email composition helper.

5. **generate-followup-email** — Post-call follow-up email generation.

6. **deepgram-token** — Issues temporary Deepgram API credentials for WebSocket STT.

7. **elevenlabs-scribe-token** — Issues temporary ElevenLabs credentials.

8. **extract-file-text** — Parses uploaded audio/document files.

### Migration Impact
All 5 AI-dependent functions must be rewritten to use Google Gemini (or the provider-agnostic abstraction layer). The token-issuing functions (deepgram-token, elevenlabs-scribe-token) can be converted to Next.js API routes.

---

## Components (135 total)

### Feature Components (87 custom)

| Feature | Count | Key Components |
|---------|-------|---------------|
| Live Call | 22 | PreCallScreen, ActiveCallScreen, PostCallScreen, CoachingTab, TranscriptTab, SuggestionsPanel, SummaryPanel, AudioVisualizer, MicrophoneSelector, QualificationTracker |
| Practice Mode | 13 | PracticeModeSetup, PracticeModeChat, PracticeModeVoiceChat, PracticeModeScorecard, CoachTipsPanel, ConfidenceGauge, VoicePickerInline |
| Sales Companion | 15 | QuestionRandomizer, DecisionMakerPrompts, ImpactQuestionBuilder, LockOnPrompts, PainPointTracker, StageSelector, TalkRatioIndicator |
| Call Analyzer | 4 | TranscriptionInput, AnalysisResults, ClientInfoHeader, FollowUpEmail |
| Email | 2 | ConversationList, ConversationDetail |
| Admin | 5 | AdminDashboard, AdminSettings, AdminUsers, AdminLogs, AdminFeatureFlags |
| Navigation | 4 | NavigationMenu, PageHeader, CommunityBanner, Footer |
| Home | 2 | FeatureCard, NextQuestionCard |
| Notes | 1 | NoteEditor |
| Utility | 7+ | BackgroundStars, EightBall, FiltersBar, LanguageSelector |

### UI Library (48 shadcn/Radix components)
Full shadcn-ui installation: button, card, dialog, form, input, tabs, badge, dropdown-menu, select, textarea, toast, tooltip, etc.

---

## Custom Hooks (16)

| Hook | Purpose |
|------|---------|
| useLiveCallRecording | Deepgram WebSocket + Web Speech API transcription, audio levels |
| useLiveCallAnalysis | Real-time suggestions, summary pinning, note management |
| useLiveCallState | Call state machine (pre/active/paused/post) |
| useCallAnalysis | Post-call transcription analysis |
| useCallHistory | Database queries for past calls |
| useEmailConversations | Email conversation CRUD |
| useSpeechRecognition | Browser Web Speech API wrapper |
| useSpeechSynthesis | TTS (ElevenLabs / browser fallback) |
| useVoiceSettings | Voice preference persistence |
| useGlobalVoice | Global voice state (ElevenLabs) |
| useAudioAnalyser | Audio frequency analysis for visualizers |
| useConfidenceMeter | Confidence/sentiment scoring |
| useAdminAuth | Role-based access control |
| useLocalStorageState | State persistence utility |
| use-toast | Sonner toast notifications |
| use-mobile | Mobile breakpoint detection |

---

## Data Assets

### Power Questions Database (`src/data/questions.ts`)
61 questions organized by Paul Cherry prompt types:
- "Describe for me" — Open-ended discovery
- "Take me through" — Process understanding
- "Prioritize for me" — Value hierarchy
- "Compare for me" — Competitive analysis
- "Versus" — Trade-off exploration
- "From start to finish" — Journey mapping
- "Change & transition" — Opportunity detection

Categories: Pain Points, Decision Makers, Current Vendor, Expectations, Logistics, Relationship Building, Comparative/Change.

### Practice Mode Personas (`src/types/practiceMode.ts`)
5 prospect types with detailed attributes:
- **Principal** — School decision maker
- **Administrator** — District-level authority
- **Dance** — Dance studio owner
- **Daycare** — Daycare center manager
- **Sports** — Sports league coordinator

Each persona has: pain points, objections, communication style, starting attitude, difficulty modifiers.

5 pre-defined coaches: Coach Paul, Coach Maria, Coach James, Coach Rosa, Coach David.

### Multilingual Support (`src/contexts/LanguageContext.tsx`)
- 800+ translation keys covering all UI strings
- Languages: English (en), Spanish (es)
- Auto-detection from browser language
- Persisted in localStorage
- **Decision: Deferred to later phase in v2**

---

## Integrations

### Lovable AI Gateway (MUST REPLACE)
- Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions`
- API Key: `LOVABLE_API_KEY` environment variable
- Used by: 5 of 8 Edge Functions (all AI features)
- **Migration:** Replace with Google Gemini via provider-agnostic abstraction layer

### Deepgram (Speech-to-Text)
- WebSocket streaming: `wss://api.deepgram.com/v1/listen`
- Model: `nova-2` with smart_format, diarize, punctuate
- Credentials via Edge Function token endpoint
- Fallback: Browser Web Speech API

### ElevenLabs (Text-to-Speech)
- Voice synthesis via Edge Function token endpoint
- Used in Practice Mode for AI voice responses

### Supabase Auth
- Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Session in localStorage
- No Skool community gating (v2 addition)

### Supabase Realtime
- Enabled on `notes` table for collaborative editing
- Uses Y.js + y-supabase for CRDTs

---

## Lovable-Specific Dependencies

| Item | Impact | Migration Action |
|------|--------|-----------------|
| `lovable-tagger@1.1.13` (devDep) | Build tool only | Remove |
| Lovable AI Gateway API | All AI features | Replace with Gemini |
| Lovable Cloud hosting | Deployment | Move to Vercel |
| Auto-generated README | Documentation | Replace |

**No `@lovable` imports in React code** — clean separation makes migration straightforward.

---

## Environment Variables

### Client-side (Vite)
```
VITE_SUPABASE_URL=https://qhoqhbkydcwxbqnngoob.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=qhoqhbkydcwxbqnngoob
```

### Edge Functions (Server)
```
LOVABLE_API_KEY=<Lovable AI gateway key>
```

### Database App Settings
Transcription engine, practice difficulty, live call settings, community banner URL, API status flags, feature flags.

---

## Key Insights for v2 Migration

1. **No Lovable SDK lock-in** — React code is clean, standard TypeScript/React. Components can be ported directly with routing changes.

2. **Lovable AI Gateway is the single biggest blocker** — 5 Edge Functions depend on it. Must be replaced with direct Gemini API calls.

3. **Database schema is solid** — RLS policies in place, migrations are sequential. Schema can be reused with additions (authorized_members, ai_provider_config, etc.).

4. **Component library is mature** — 87 custom components represent significant business logic. Worth porting, not rewriting.

5. **Audio handling is production-ready** — Deepgram WebSocket streaming with Web Speech API fallback, audio visualizers, microphone management.

6. **Personas and questions are valuable data** — 61 power questions + 5 detailed persona profiles encode the Paul Cherry methodology.

7. **Multilingual was built from day 1** — 800+ translation keys. Deferred in v2 but infrastructure should be migration-ready.

8. **Admin system is functional** — Role-based access, app settings, feature flags, activity logs. Needs expansion for v2 (AI provider config, cost dashboard).

9. **No payment integration** — Stripe is a v2 addition.

10. **No CRM integration** — Local `clients` table only. Zoho Bigin is a v2 addition.
