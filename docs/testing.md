# Testing & quality gates

This document describes how FitPlus runs automated checks locally and in CI.

## Backend (FastAPI)

**Requirements:** PostgreSQL with PostGIS (same major version as production), Python 3.12, Tesseract on `PATH` for label-scan tests.

From `backend/`:

```bash
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head
pytest -v
```

**Coverage** (optional locally):

```bash
pytest -v --cov=app --cov-report=term-missing
```

**Lint / format:**

```bash
ruff check app tests
ruff format app tests
```

### Integration tests

- `tests/conftest.py` runs each test in a DB transaction that is rolled back, with `get_db` overridden so HTTP calls use that session.
- New API coverage lives alongside existing modules (`test_auth_api.py`, `test_ai_chat_integration.py`, `test_payments_api.py`, etc.).

### Agent evals (mocked LLM, CI-safe)

- **Declarative cases:** `backend/tests/evals/golden_cases.yaml` — add scenarios without changing Python when possible.
- **Runner:** `backend/tests/evals/test_agent_evals.py` — patches `llm_service.generate`, asserts HTTP responses, message persistence, and DB `agent_type`.
- These are **contract tests**, not subjective LLM quality scoring.

### Live LLM evaluations (CI — real API calls)

`backend/tests/evals/test_agent_live_evals.py` contains **5 tests** that make real API calls through the FastAPI routes and assert on semantic output (keyword presence, conversation persistence across turns). They are marked `@pytest.mark.live_llm` and skip automatically when no API key is present.

In CI, `ANTHROPIC_API_KEY` is passed from **GitHub Actions Secrets** — the tests run on every push/PR to `main` as long as the secret is configured.

Covered cases:
- Workout agent returns a response containing workout-related keywords
- Workout agent persists a multi-turn conversation (≥4 messages after 2 exchanges)
- Diet agent returns a response containing nutrition-related keywords
- Diet agent conversation appears in the `/conversations` list

For a local run: set `ANTHROPIC_API_KEY` and `LLM_PROVIDER=anthropic` in `backend/.env`, then:

```bash
pytest -v -m live_llm
```

**Never commit secrets to the repo.**

## Mobile (Expo)

From `mobile/`:

```bash
npm ci
npm run lint
npm test
npx tsc --noEmit
```

Unit tests live under `src/**/__tests__/*.test.ts(x)` (Jest + `jest-expo`).

ESLint is configured for incremental tightening: hook rules are enforced (errors fail CI); many legacy issues surface as **warnings** only, so `npm run lint` exits successfully until you adopt `--max-warnings 0`.

## GitHub Actions

Workflow: `.github/workflows/ci.yml`

| Job              | Purpose                                              |
|-----------------|-------------------------------------------------------|
| `backend`       | Ruff, Alembic `upgrade head`, pytest + coverage XML   |
| `mobile`        | ESLint, Jest, TypeScript `--noEmit`                   |
| `docker-backend`| Builds the backend Dockerfile (no push)               |

Coverage XML is uploaded as a workflow artifact for inspection; enabling Codecov or similar is optional.

## Docker parity

The `docker-backend` job verifies that `backend/Dockerfile` still builds after dependency or OS package changes (e.g. Tesseract).
