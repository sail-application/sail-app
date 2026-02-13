# ADR 0002: AI Provider Abstraction Layer

## Status
Accepted

## Context
The legacy app is locked to Lovable's AI gateway. We need to:
- Replace the Lovable dependency with direct API calls
- Support multiple AI providers (Gemini, Claude, OpenAI, DeepSeek)
- Allow per-feature provider configuration without code deploys
- Track token usage for cost monitoring

## Decision
Build a provider-agnostic abstraction layer at `lib/ai/provider.ts`.

## Design
```
lib/ai/
├── provider.ts      ← Router: reads config, dispatches to correct provider
├── gemini.ts        ← Google Gemini implementation (default)
├── usage-tracker.ts ← Token counting + DB logging
├── openai.ts        ← Future: OpenAI implementation
├── anthropic.ts     ← Future: Claude implementation
└── deepseek.ts      ← Future: DeepSeek implementation
```

Each provider implements `AiProviderInterface` (chat + chatStream methods).
The `ai_provider_config` table stores which provider/model each feature uses.

## Rationale
- **Flexibility**: Switch providers per feature via admin panel
- **Cost control**: Track tokens per feature/user for budgeting
- **Resilience**: Can fail over to alternative providers
- **No vendor lock-in**: Never again dependent on a single AI gateway

## Consequences
- Extra abstraction layer adds minor complexity
- Must maintain multiple provider implementations
- Config caching needed to avoid excessive DB queries
