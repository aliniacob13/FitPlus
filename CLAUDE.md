# FitPlus - AI-Powered Fitness Companion

## Project Overview
FitPlus is a mobile application tracking physical activity, nutrition, and gym discovery.
It features two AI agents (Workout Trainer & Diet Counselor) powered by external LLM APIs.

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