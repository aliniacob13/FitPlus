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

## GitHub Actions (CI/CD)

Workflow: `.github/workflows/ci.yml`

| Job              | Trigger            | Purpose                                                       |
|-----------------|--------------------|---------------------------------------------------------------|
| `backend`       | push + PR → main   | Ruff, Alembic `upgrade head`, pytest + coverage XML           |
| `mobile`        | push + PR → main   | ESLint, Jest, TypeScript `--noEmit`                           |
| `docker-backend`| push + PR → main   | Builds the backend Dockerfile (no push) — verifies it compiles|
| `publish`       | push → main only   | Builds and **pushes** the backend image to GHCR (CD step)     |

Coverage XML is uploaded as a workflow artifact for inspection; enabling Codecov or similar is optional.

## Continuous Deployment — GHCR

The `publish` job runs **only on direct push to `main`** (not on PRs), after all three CI jobs pass (`needs: [backend, mobile, docker-backend]`). It publishes the backend Docker image to **GitHub Container Registry**:

```
ghcr.io/aliniacob13/fitplus-backend:latest
ghcr.io/aliniacob13/fitplus-backend:<git-sha>
```

Authentication uses the automatic `GITHUB_TOKEN` (no extra secrets needed); the job declares `permissions: packages: write`. The `:latest` tag always points to the most recent successful build on `main`; the SHA tag is immutable and enables precise rollbacks.

The published image is visible under the repository's **Packages** tab on GitHub. To pull it locally:

```bash
docker pull ghcr.io/aliniacob13/fitplus-backend:latest
```

## Docker parity

The `docker-backend` job verifies that `backend/Dockerfile` still builds after dependency or OS package changes (e.g. Tesseract). The `publish` job then does the actual push to the registry, reusing the GHA layer cache.
