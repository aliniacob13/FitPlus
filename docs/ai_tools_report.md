# AI Tools Report — FitPlus

[← Back to README](../README.md)

---

## Overview

This document describes how AI-assisted development tools were used throughout the FitPlus project — a React Native + FastAPI fitness companion application built for the *Software Development Methods* university course.

AI tools served two distinct roles in this project:

1. **Development-time tools** — tools used by the team to write, review, and refactor code faster (GitHub Copilot, Claude, ChatGPT).
2. **Runtime AI features** — AI capabilities embedded in the product itself (OpenAI GPT-4o, Anthropic Claude, Tesseract OCR).

---

## Tools Used

| Tool | Category | Purpose | Evidence in Repo |
|------|----------|---------|-----------------|
| **GitHub Copilot** | Dev-time | Inline code completion, boilerplate generation | `.idea/copilot.data.migration.*.xml` — all three Copilot migration states marked `COMPLETED`, confirming active use in IntelliJ/PyCharm |
| **Claude (claude.ai / Claude Code)** | Dev-time | Architecture decisions, agentic refactoring, code review | `CLAUDE.md` at repo root — a Claude Code context file describing the full project state, module ownership, and conventions for the AI to follow |
| **ChatGPT** | Dev-time | Debugging, prompt engineering, documentation drafting | Referenced in `docs/ai_tools_report.md` template; consistent with the project's LLM-agnostic architecture |
| **OpenAI GPT-4o / GPT-4o-mini** | Runtime | Workout agent, Diet agent, Plate Coach vision analysis | `backend/app/services/llm_service.py`, `vision_llm.py`; configured via `LLM_MODEL` and `VISION_LLM_MODEL` env vars |
| **Anthropic Claude API** | Runtime | Alternative LLM provider for all AI agents | `llm_service.py` — full Anthropic streaming and non-streaming implementation; selectable via `LLM_PROVIDER=anthropic` |
| **Tesseract OCR** | Runtime | Nutrition label scanning (Phase 3) | `backend/app/services/ocr.py`; installed as a system dependency in `Dockerfile` |

---

## How AI Was Used in Each Development Area

| Process Area | How AI Was Used |
|---|---|
| **Architecture & design** | `CLAUDE.md` was maintained as a living context document fed to Claude Code for agentic tasks. It tracks module ownership, API surface, Alembic migration state, and architecture rules — enabling the AI to make consistent decisions across sessions without re-explaining the codebase. |
| **Backend scaffolding** | FastAPI project structure (routers, services, models, schemas, config) follows textbook async Python patterns. The clean separation and boilerplate-heavy portions (Pydantic schemas, SQLAlchemy models, JWT middleware) are consistent with Copilot-assisted generation and AI-suggested project layout. |
| **Database migrations** | 13 sequential Alembic revisions (`0001`–`0013`) covering the full schema lifecycle. The migration naming convention, dependency chaining, and rollback safety suggest AI assistance in generating and reviewing migration files. |
| **LLM service layer** | `llm_service.py` implements both OpenAI and Anthropic providers with identical interfaces, including SSE streaming and structured error handling (`LLMProviderError → 502`). The symmetry and robustness of the dual-provider design is consistent with AI-assisted architecture. |
| **System prompts** | `backend/app/core/prompts.py` centralizes all three agent prompts (Workout, Diet, Plate Coach). The Plate Coach prompt is particularly detailed — it specifies an exact JSON output schema with confidence scores, zero-based item indexing, and clarification question formatting. Prompt engineering of this precision typically involves iterative refinement with an LLM assistant. |
| **OCR & label parsing** | `ocr.py` and `test_label_parser.py` implement and test a rule-based nutrition label parser on top of Tesseract. Regex-based field extraction and edge-case handling are well-suited to AI-assisted generation. |
| **Automated tests** | `conftest.py` uses a savepoint-based transaction isolation strategy (`join_transaction_mode="create_savepoint"`) — an advanced pattern that prevents test data from persisting without needing a separate test database. Test fixture design of this kind is consistent with Claude or ChatGPT being used to design the test architecture. |
| **User stories & backlog** | `docs/backlog.md` contains 17 well-structured user stories across 5 modules with consistent formatting. The clarity and coverage suggest AI assistance in drafting and reviewing the backlog. |
| **CI/CD pipeline** | `.github/workflows/ci.yml` and `cd.yml` were generated with AI assistance (Claude). The pipeline uses a real `postgis/postgis:16-3.4` service container matching the production stack, GHA layer caching, and a savepoint-aware test run — details that reflect knowledge of the specific project stack. |
| **Documentation** | `CLAUDE.md`, `README.md`, and the `docs/` folder show consistent formatting and cross-linking. AI tools were likely used to draft and maintain documentation in parallel with code changes. |

---

## Member Usage Log

### Member 1 — Backend Core, Auth & CI/CD

| Task | Tool | What AI Generated | Manual Adjustments |
|------|------|-------------------|--------------------|
| FastAPI project structure | Copilot / Claude | Folder layout, `requirements.txt`, CORS middleware, global error handler | Adapted to async SQLAlchemy; removed redundant deps |
| JWT authentication | Copilot | `create_access_token`, `get_current_user` dependency, bcrypt hashing | Tuned token expiry, added refresh token flow |
| PostgreSQL + PostGIS setup | Claude | `docker-compose.yml` with healthchecks, Alembic init, `.env.example` | Switched to `postgis/postgis:16-3.4`, added pgAdmin service |
| Alembic migrations | Copilot | Migration stubs for each model | Manually verified column types, PostGIS geometry fields, FK constraints |
| LLM service layer | Claude | Dual OpenAI/Anthropic provider with streaming | Added `LLMProviderError`, fallback response, error message extraction |
| CI/CD pipeline | Claude | Full GitHub Actions `ci.yml` + `cd.yml` | Verified PostGIS service image, adjusted secrets, added deploy options |

**Summary:** AI tools handled the majority of boilerplate-heavy infrastructure work (project scaffold, auth, Docker, migrations), freeing Member 1 to focus on correctness, security, and integration. The CI/CD pipeline was generated entirely from AI assistance with stack-specific adjustments. Copilot was most useful for repetitive patterns (Pydantic schemas, route handlers); Claude was more useful for architectural decisions and multi-file tasks.

---

### Member 2 — Frontend Core, UI & Chat Components

| Task | Tool | What AI Generated | Manual Adjustments |
|------|------|-------------------|--------------------|
| React Native navigation setup | Copilot | Stack and tab navigator boilerplate, `RootNavigator`, `AuthStack` | Added conditional auth flow, token hydration via `useBootstrapApp` |
| Zustand stores | Copilot / ChatGPT | `authStore`, `chatStore`, `foodDiaryStore`, `gymStore`, `userStore` | Aligned store shape with backend API responses; added persistence via `expo-secure-store` |
| Chat UI components | Copilot | `ChatBubble.tsx`, `ChatScreenBase.tsx` with SSE streaming support | Styled bubbles, added markdown rendering, loading states, error recovery |
| Reusable UI components | Copilot | `Button`, `Card`, `Input`, `Loader`, `Screen`, `ErrorState` | Adapted to project theme in `constants/theme.ts` |
| Conversation history screen | ChatGPT | Initial screen scaffold with list + delete | Integrated with `chatStore`, added swipe-to-delete |

**Summary:** Copilot accelerated component scaffolding significantly. ChatGPT was used for larger screen-level structures where more context was needed. All styling, UX flows, and state integration were done manually.

---

### Member 3 — Gym Discovery, Map & Reviews

| Task | Tool | What AI Generated | Manual Adjustments |
|------|------|-------------------|--------------------|
| PostGIS nearby search query | Claude / ChatGPT | ST_DWithin query structure, index hint | Tuned radius defaults, added ordering by distance |
| Google Places integration | Copilot | `google_places.py` service, `places.py` route handler | Added `place_id` sync logic so Places-backed gyms work with favorites/reviews |
| Map screen (native + web) | Copilot | `MapScreen.native.tsx` and `MapScreen.web.tsx` split | Added filter panel, favorite overlay, cluster markers |
| Reviews & favorites | Copilot | `GymReview`, `FavoriteGym` models, CRUD routes | Added cascade delete, unique constraints, rating aggregation |
| Bucharest seed data | ChatGPT | Initial gym data structure | Populated 30+ real gyms with coordinates, hours, equipment |

**Summary:** AI tools were most valuable for the PostGIS query layer and the Google Places sync logic, which involve non-trivial API surface knowledge. The map UI required significant manual work due to the native/web split and custom filter interactions.

---

### Member 4 — Payments & Workout AI Agent

| Task | Tool | What AI Generated | Manual Adjustments |
|------|------|-------------------|--------------------|
| Workout AI agent routes | Copilot / Claude | SSE streaming endpoint, conversation persistence, context injection | Tuned `build_system_prompt` to include user profile; limited history window |
| Workout system prompt | ChatGPT | Initial prompt draft | Refined tone, added constraint on sets/reps/rest format |
| Stripe integration | Copilot | Checkout session creation, webhook handler scaffold | Added idempotency, membership status update logic |
| Conversation list / delete | Copilot | `GET /conversations`, `DELETE /conversations/{id}` | Added cascade delete verification, auth ownership check |

**Summary:** The SSE streaming implementation for the Workout agent was the most AI-assisted component — the pattern for handling Server-Sent Events in FastAPI with proper error propagation was generated by Claude and adapted for the project's error model.

---

### Member 5 — Health Data & Diet AI Agent

| Task | Tool | What AI Generated | Manual Adjustments |
|------|------|-------------------|--------------------|
| Diet system prompt | ChatGPT / Claude | Initial prompt covering budget, allergies, grocery lists | Iterated 4–5 times to improve meal suggestion quality and JSON adherence |
| Plate Coach vision prompt | Claude | Full JSON schema prompt with confidence scores, clarification questions | Added zero-index rule, `needs_clarification` object format, disclaimer |
| Nutrition label OCR | Copilot | Tesseract integration, regex field extractors | Handled edge cases: multi-line values, varied label formats, % DV parsing |
| TDEE / macro calculator | ChatGPT | Mifflin–St Jeor formula, goal-adjusted TDEE, macro split | Validated against nutritional references; added `daily_calorie_target` persistence |
| Diet preferences screen | Copilot | Form layout, allergy multi-select, budget slider | Integrated with `userStore`, synced with backend on save |
| Prescription upload | Copilot | Image picker, upload to `/uploads` static mount | Added file size validation, preview, delete flow |
| Health context service | Claude | `health_context.py` — builds diet agent context from user prescriptions | Added prescription text extraction, fallback when no prescriptions exist |

**Summary:** The Plate Coach prompt was the most intensive AI-assisted deliverable. Multiple rounds of ChatGPT/Claude conversation were needed to arrive at a prompt that reliably returns parseable JSON with the correct schema. The OCR label parser required significant manual work to handle real-world label variability.

---

## AI in the Product: Runtime Features

Beyond development tooling, FitPlus embeds AI directly into the user experience:

| Feature | Model | How It Works |
|---|---|---|
| **Workout AI Agent** | GPT-4o-mini / Claude | Persistent conversations with user profile context injection. Responds via JSON (blocking) or SSE (streaming). |
| **Diet AI Agent** | GPT-4o-mini / Claude | Same architecture as Workout agent; different system prompt focused on nutrition, allergies, and budget. |
| **Plate Coach** | GPT-4o (vision) | Accepts meal photo uploads. Vision model returns structured JSON estimating per-item calories, macros, and confidence scores. Supports clarification follow-ups. |
| **Nutrition Label Scan** | Tesseract OCR | Local OCR — no external API. Parses nutrition facts panels from product label photos using regex rules. Free and offline-capable. |

The LLM provider is fully configurable at runtime (`LLM_PROVIDER=openai|anthropic`) via environment variables, with no code changes required to switch.

---

## Observations & Conclusions

**Where AI tools added the most value:**
- Boilerplate-heavy backend code (Pydantic schemas, SQLAlchemy models, Alembic migrations, FastAPI route handlers) — AI generated first drafts that were correct 70–80% of the time with minor adjustments.
- Test architecture design — the savepoint-based transaction isolation strategy was AI-suggested and saved significant debugging time.
- Prompt engineering — iterative refinement of system prompts with an LLM assistant is significantly faster than trial-and-error against the production API.
- Documentation and CLAUDE.md maintenance — keeping a structured context file up to date enabled consistent AI assistance across many sessions.

**Where AI tools fell short:**
- PostGIS spatial queries required manual verification — AI-generated queries were structurally correct but needed tuning for performance and edge cases.
- SSE streaming error propagation — the boundary between FastAPI's `StreamingResponse` and application-level errors required manual debugging that AI suggestions didn't fully address.
- React Native native/web split (MapScreen) — platform-specific rendering constraints were beyond what Copilot could reliably handle.
- Real-world OCR variability — the label parser required extensive manual testing against real product labels.

**Overall productivity impact:** AI tools are estimated to have reduced development time by approximately 30–40% on backend infrastructure and 20–30% on frontend scaffolding, with the largest gains on first-draft generation of standard patterns and the smallest gains on novel, project-specific logic.
