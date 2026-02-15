# ADR 0003: Methodology Hierarchy & AI Coaching Architecture

## Status
Accepted

## Context
SAIL's Strategies Library is limited to Paul Cherry's methodology with 6 static techniques. We need to support 13+ sales methodologies, each with unique stages, scoring rubrics, and AI coaching instructions. The data model must serve both user-facing content and LLM-agnostic AI prompt composition.

## Decision
Introduce a `methodologies` parent table with JSONB columns for AI coaching content. Each methodology stores its own prompt templates, scoring rubrics, stages, question types, and vocabulary. The existing `strategies` table becomes child techniques linked via FK.

## Schema Design
```
methodologies (parent)
  ├── Display: name, slug, author, description, videos, books
  ├── AI Content: system_prompt_template, scoring_rubric, stages, question_types
  └── Metadata: category, complexity_level, access_tier, trademark_attribution

strategies (child techniques)
  └── methodology_id FK → methodologies(id)

user_methodology_preferences
  └── Partial unique index: one primary per user

methodology_events (append-only)
  └── Analytics backbone: tracks all methodology interactions
```

## Why JSONB for AI Content
Each methodology has a different structure (SPIN has 4 stages, Sandler has 7, Paul Cherry has 3). JSONB provides:
- Single-query access (one row = everything the prompt composer needs)
- Schema flexibility for wildly different methodology structures
- Atomic versioning (update all AI content in one row)
- No cross-methodology queries needed on internal structure

## Prompt Composition (5-layer)
```
Layer 1: Base Identity     → "You are a sales coaching AI..."
Layer 2: Methodology       → system_prompt_template + stages + question_types
Layer 3: Feature-Specific  → feature_prompt_overrides[feature]
Layer 4: User Context      → proficiency level adaptation
Layer 5: Session Context   → current transcript/scenario
```

## LLM Agnosticism
All prompts output standard `AiMessage[]` format. Each provider translates to its own format. Scoring validation is provider-independent — AI returns qualitative assessments, app does weighted math.

## Consequences
- Extra JSONB complexity in admin forms (need structured editors)
- Seed data is verbose (each methodology needs full AI coaching content)
- Must validate JSONB structure at application layer (Zod schemas)
- Event table will grow — plan partitioning at 500K+ rows
