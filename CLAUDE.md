# FitPlus - AI-Powered Fitness Companion

## Project Overview
FitPlus is a mobile application tracking physical activity, nutrition, and gym discovery.
It features two AI agents (Workout Trainer & Diet Counselor) powered by external LLM APIs.

## Current project status (baseline for `main`)

High-level state of the repo as of the latest merge-ready work:

- **Auth & users:** JWT login/register, real `User` records in PostgreSQL; profile read/update APIs.
- **Gym discovery:** PostGIS nearby search, Google Places integration via backend (`places` + gym sync by `place_id` so favorites/reviews work for Places-backed gyms).
- **Gym social:** `GymReview` and `FavoriteGym` models, APIs, and mobile UI (reviews, favorites, map filters) — see teammate ownership for details.
- **AI agents (backend):** Persistent conversations, context injection, non-streaming and SSE chat — **PERSOANA 1** scope below.
- **Nutrition & food diary:** TDEE / macro calculator, USDA-backed food search, daily food log with totals, nutrition-label scan (OCR + parser), plate coach (vision LLM + `nutrition_vision` conversations), persisted `daily_calorie_target` on the user — see **Nutrition & food diary** below.
- **Ops:** `docker-compose` for DB + backend (Alembic on startup) + optional pgAdmin; see `docs/run_project_guide.md` and related docs.

Official Expo app lives under **`/mobile`** (not `/frontend`).

---

## PERSOANA 1 — AI Agents Core (Backend) — implemented

Backend-only scope: conversations, LLM integration, streaming. No payments, no gym-review changes in this track.

### Database

- **`conversations`:** `user_id`, `agent_type` (`workout` | `diet`), `title`, `created_at`; cascade delete with messages.
- **`messages`:** `conversation_id`, `role` (`user` | `assistant`), `content`, `created_at`.
- **Alembic:** migrations include conversation/message tables and DB check constraints aligned with the models (e.g. revision `0007` for AI table constraints — verify `alembic_version` after deploy).

### HTTP API (`/api/v1/ai`)

| Method | Path | Purpose |
|--------|------|--------|
| `POST` | `/workout/chat`, `/diet/chat` | Chat with optional `conversation_id`; persists user + assistant messages. |
| `GET` | `/workout/chat/stream`, `/diet/chat/stream` | SSE streaming for the same agents (query: `message`, optional `conversation_id`). |
| `GET` | `/conversations` | List current user’s conversations. |
| `GET` | `/conversations/{id}/messages` | Full message history for one conversation. |
| `DELETE` | `/conversations/{id}` | Delete a conversation (and messages via cascade). |

All routes require a valid **Bearer** token (same auth as the rest of the API).

### Context & prompts

- **System prompts** live in `backend/app/core/prompts.py` (workout vs diet), not inlined in route handlers.
- **User profile** (name, age, weight, height, fitness level, goals) is appended to the system prompt via `build_system_prompt`.
- **Recent turns** from the DB (last *N* messages, configurable in code) are passed to the LLM as `user`/`assistant` pairs before the latest user message.

### LLM layer

- `backend/app/services/llm_service.py`: non-streaming `generate` and async `generate_stream` for OpenAI / Anthropic (via env-configured provider).
- Provider failures surface as **`LLMProviderError`** → `502` on JSON chat routes or an SSE `error` event on stream routes.
- Configure **`LLM_PROVIDER`**, **`LLM_MODEL`**, and the matching API key (e.g. `ANTHROPIC_API_KEY`) in `.env`; never commit secrets.

### Tests

- Lightweight tests for AI helpers (e.g. conversation title trimming, LLM message list building) under `backend/tests/`.

---

## Nutrition & food diary (backend + mobile)

End-to-end nutrition tooling: calculator, diary, label scan, and plate coach. Mobile screens live under `mobile/src/screens/nutrition/` with Zustand in `mobile/src/store/foodDiaryStore.ts`.

### Phases (what shipped)

1. **Calorie target:** `POST /api/v1/users/me/nutrition-targets/compute` (Mifflin–St Jeor → TDEE → goal-adjusted target + macro suggestion). Persists `daily_calorie_target` and `nutrition_target_updated_at` on `users`; `GET /api/v1/users/me` exposes the saved target for app hydration after login.
2. **Food search & diary:** `GET /api/v1/nutrition/foods/search` (USDA FoodData Central), `GET/POST /api/v1/users/me/food-log`, `DELETE /api/v1/food-log/{entry_id}`. Entries support `source` (e.g. manual, USDA, `label_scan`, `plate`) for provenance.
3. **Label scan:** `POST /api/v1/nutrition/label-scan` — image upload, Tesseract OCR, rule-based label parser (`backend/app/services/ocr.py`). Tests: `backend/tests/test_label_parser.py`.
4. **Plate coach:** `POST /api/v1/ai/nutrition/plate/analyze` and `POST /api/v1/ai/nutrition/plate/clarify` — vision LLM (`backend/app/services/vision_llm.py`), tied to `conversations` with `agent_type` including `nutrition_vision` (Alembic `0010`). Large images are downscaled before the vision call (`NUTRITION_PLATE_VISION_MAX_EDGE_PX`).

### Environment (backend `.env`)

- **`USDA_API_KEY`** — FoodData Central (optional; demo key limits apply when empty).
- **`VISION_LLM_MODEL`** — model used for plate analysis (must accept images; same provider keys as main LLM).
- **`NUTRITION_LABEL_SCAN_MAX_IMAGE_MB`**, **`NUTRITION_PLATE_MAX_IMAGE_MB`**, **`NUTRITION_PLATE_VISION_MAX_EDGE_PX`** — upload and vision payload limits.

### Alembic touchpoints

- Food log table and constraints: `0008` (and follow-ups as needed).
- `food_log.source` extended for label scan: `0009`.
- `conversations.agent_type` includes `nutrition_vision`: `0010`.
- User `daily_calorie_target` (+ timestamp): `0011`.

### Mobile API errors

- Shared helper **`formatApiError`** in `mobile/src/utils/apiErrors.ts` turns Axios / FastAPI `detail` (string, validation list, or object) into a user-visible string; used by the food diary store, calorie calculator, add-food search, label scan, and plate coach (including partial save when some `addEntry` calls fail).

---

## Tech Stack
- **Frontend (Mobile):** React Native (Expo), TypeScript, Zustand (State), React Navigation, react-native-maps.
- **Backend:** FastAPI (Python), SQLAlchemy, Pydantic.
- **Database:** PostgreSQL with PostGIS extension, Alembic for migrations.
- **AI Integration:** LLM API (e.g., OpenAI/Anthropic) using LangChain or direct SDKs.
- **Payments:** Stripe Checkout.
- **Infrastructure:** Docker & docker-compose.

## Architecture Rules & Guidelines
1. **Separation of Concerns:** Never mix backend code into the `/mobile` folder or vice versa.
2. **Backend (FastAPI):**
   - Strictly use Python type hints and Pydantic models for request/response validation.
   - Use async routes and async database sessions.
   - All spatial queries (for Gym Discovery) MUST use PostGIS functions.
   - Never hardcode API keys. ALWAYS use environment variables (`.env`).
3. **Frontend (React Native):**
   - Strictly use TypeScript (`.tsx` / `.ts`). No `any` types allowed.
   - State must be managed via Zustand. No Redux or Context API for complex state.
   - UI components should be modular and reusable.
4. **AI Agents:**
   - AI logic resides entirely on the backend. The mobile app only acts as a UI (Chat interface).
   - Use standard streaming endpoints (Server-Sent Events) for AI chat responses to reduce perceived latency.
   - Keep system prompts centralized in a separate configuration file, not mixed in the route logic.

## Common Commands
- **Backend:**
  - Run server: `cd backend && uvicorn app.main:app --reload`
  - Migrations: `cd backend && alembic revision --autogenerate -m "msg"` then `alembic upgrade head`
- **Frontend:**
  - Run app: `cd mobile && npx expo start`
- **Infrastructure:**
  - Start DB: `docker-compose up -d`