# PRD: Methodologies Library (Strategies)

## Overview
Transform the flat Strategies Library into a two-level **Methodology > Techniques** hierarchy supporting 13+ sales methodologies. Users browse, compare, and select methodologies. AI coaching adapts to the user's active methodology across all SAIL features.

## Problem
The current Strategies Library only supports Paul Cherry's "Questions That Sell" with 6 static technique cards. Users cannot explore other proven sales methodologies, and AI coaching is hardcoded to a single framework.

## Goals
1. Users can browse 13+ sales methodologies with rich content (videos, books, explanations)
2. Users select a primary methodology that flows through all AI features
3. Admins manage methodologies via a full CRUD console
4. AI prompts, scoring rubrics, and coaching adapt per-methodology
5. Event tracking captures methodology usage across all features
6. Architecture supports multiple LLM providers (Gemini, OpenAI, Claude, DeepSeek)

## User Stories
- As a **sales rep**, I want to browse methodologies so I can find the best fit for my selling style
- As a **sales rep**, I want to set a primary methodology so AI coaching uses that framework
- As a **sales rep**, I want to see videos and book references so I can learn more
- As an **admin**, I want to create/edit/disable methodologies without code deploys
- As an **admin**, I want to see which methodologies are most popular with users

## Scope

### In Scope (MVP)
- `methodologies` table with display + AI coaching content
- User methodology preferences with one-primary constraint
- Methodology events tracking
- 13 seeded methodologies with AI coaching content
- User-facing browse/detail pages
- Admin CRUD pages
- Prompt composer with 5-layer methodology-aware prompts
- Multi-LLM provider implementations (OpenAI, Claude, DeepSeek)

### Out of Scope (Deferred)
- Spaced repetition scheduling
- Daily drill / Duolingo-style engagement
- Team methodology policies
- Stripe subscription tiers
- Methodology marketplace
- Provider failover / health checks

## Success Metrics
- 80%+ of active users select a primary methodology within 7 days
- AI coaching quality scores maintained across all LLM providers
- Admin can create a new methodology in < 10 minutes

## Technical Approach
See ADR 0003: Methodology Hierarchy for architectural decisions.
