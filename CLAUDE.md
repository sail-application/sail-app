# SAIL — Sales Advice Improvement Live

## Project Overview

SAIL is a suite of sales automation tools for **SA Picture Day**, a volume photography business in San Antonio, TX. The business serves dance studios, schools, daycares, and sports organizations. The owner (Alex) is an experienced IT leader but not a developer — all code must be written with that in mind.

The first priority tool is a **lead generation engine** that discovers potential clients online based on defined criteria and creates new leads in the Zoho Bigin CRM.

## Target Market Context

SA Picture Day's primary prospects are:
- Dance studios (highest priority — 90+ studios researched in the San Antonio area)
- Schools and daycares
- Sports organizations and leagues
- Any organization that holds recurring events involving groups of people

When generating leads, prioritize businesses that:
- Have an active online presence (website, social media)
- Appear to host events, recitals, picture days, or group activities
- Are in the San Antonio, TX metro area (unless told otherwise)

## Folder Structure

```
sail-crm-engine/
├── modules/           # Individual sales tools
│   ├── prospect-enrichment/   # Enrich and qualify CRM prospects
│   ├── lead-generation/       # Discover and create new leads
│   └── (future modules)/
├── integrations/      # Platform connectors
│   └── bigin/         # Zoho Bigin CRM integration
├── shared/            # Common utilities, config, helpers
│   ├── config/        # Environment and app configuration
│   └── utils/         # Reusable functions
├── docs/              # Setup guides, API notes, runbooks
└── CLAUDE.md          # This file
```

## Tech Stack

- **Language:** Choose the best language per task. Default to **Python** for API integrations and data processing unless there's a clear reason for another choice. Always explain the choice.
- **Dependencies:** Use well-maintained, popular libraries. Avoid obscure or unmaintained packages.
- **Environment:** All secrets (API keys, tokens) must be stored in environment variables or a `.env` file. Never hardcode credentials. Include `.env` in `.gitignore`.

## Integrations

### Zoho Bigin CRM
- Primary CRM for all lead and contact management.
- API documentation: https://www.bigin.com/developer/docs/apis/
- All new leads should be created as Contacts or Pipeline records (confirm with user which module).
- **Never overwrite existing CRM records without asking.** When a matching record is found, present the conflict and ask how to proceed.

### Future Integrations (not yet active)
- Hunter.io — email discovery
- Google Sheets — data import/export
- Additional platforms will be added over time

## Code Standards

### Priority Order
1. **Production-ready with error handling** — Every API call, file operation, and external dependency must have proper try/catch/error handling. Fail gracefully with clear error messages.
2. **Heavily commented** — Comment every function, explain the "why" not just the "what." Assume the reader understands IT concepts but not programming patterns.
3. **Simple and low-complexity** — Prefer straightforward, readable code over clever abstractions. Flat is better than nested. Fewer files is better than many. If a simpler approach works, use it.
4. **Future-aware** — Before making architectural decisions, briefly explain tradeoffs and ask if the user wants to go simple now or invest in a more scalable approach. Default to simple.

### Documentation
- Every module must include a `README.md` explaining: what it does, how to set it up, how to run it, and what environment variables it needs.
- Include a `docs/SETUP.md` in the repo root with step-by-step instructions for getting the entire project running from scratch.
- When creating new files, include a comment block at the top explaining the file's purpose.

## Permissions and Safety Rules

### Always Ask Before:
- Sending emails or messages to real people
- Deleting or overwriting existing CRM records
- Any irreversible operation (database drops, bulk deletes, etc.)
- Spending money (paid API calls beyond free tiers)

### Override Mode:
If the user says **"proceed without warnings"** or similar, skip confirmation prompts and execute. This override applies only to the current task/session.

### Default Permissions:
- **Read:** Full access to all modules, integrations, and data
- **Write:** Full access — create files, records, configs as needed
- **Delete/Overwrite:** Ask first (unless override mode is active)

## Development Workflow

- **Branch strategy:** Create a feature branch for each new tool or significant change. Name branches descriptively: `feature/lead-gen-v1`, `fix/bigin-auth-error`, etc.
- **Commits:** Use clear commit messages. Format: `type: description` (e.g., `feat: add lead generation module`, `fix: handle Bigin rate limit`, `docs: add setup guide`)
- **PR-ready:** When a task is complete, summarize what was done and what the user needs to do next (set env vars, install dependencies, etc.)

## Quality Assurance — Required for Every Task

Every piece of code must go through the following checks before being considered complete. Do not skip any step. Report results to the user.

### 1. Security Checks
- Scan for hardcoded credentials, API keys, tokens, or secrets — flag and fix immediately
- Validate that all user inputs are sanitized before use (no injection vulnerabilities)
- Verify that `.env` and sensitive files are listed in `.gitignore`
- Check dependencies for known vulnerabilities (use tools like `pip audit`, `npm audit`, or equivalent)
- Ensure API calls use HTTPS and proper authentication
- Review file permissions — no unnecessary write access

### 2. Code Validation
- Lint all code using standard tools for the language (e.g., `flake8`/`ruff` for Python, `eslint` for JS)
- Verify all imports resolve and no unused dependencies exist
- Confirm environment variables are documented and validated at startup (fail fast with clear messages if missing)
- Check for consistent naming conventions and code style throughout

### 3. Debugging
- Run the code and verify it executes without errors
- Test error handling paths — simulate API failures, missing config, bad data
- Verify logging is in place for key operations (API calls, record creation, errors)
- Confirm graceful degradation — a failure in one step should not crash the entire tool

### 4. QA and Beta Testing
- **Dry run mode:** Every tool must support a dry run flag that simulates the full workflow without writing to production systems (no CRM writes, no emails, no external changes). This is the default first run.
- **Test with sample data:** Create and use sample/mock data before touching real systems
- **Edge cases:** Test with empty inputs, duplicate records, API rate limits, and malformed data
- **Validation report:** After all checks pass, provide a summary:
  - ✅ Security: [pass/issues found]
  - ✅ Lint: [pass/issues found]
  - ✅ Runs without errors: [pass/fail]
  - ✅ Error handling tested: [pass/fail]
  - ✅ Dry run successful: [pass/fail]
  - ⚠️ Known limitations or areas to watch

Only after all checks show green should the code be submitted as complete.

## Getting Started (for Claude Code sessions)

1. Check if dependencies are installed; if not, set up the environment
2. Read this CLAUDE.md for context
3. Check existing code in the repo before creating new files — avoid duplication
4. Ask clarifying questions early rather than making assumptions
5. When the task is done, provide a clear summary of: what was built, how to run it, and what's left to do
