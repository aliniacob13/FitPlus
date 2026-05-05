# Member 1 — Backend Core, Auth & CI/CD

[← Task Distribution](../task_distribution.md) · [← README](../../README.md)

---

## Role

You build the foundation that the entire team depends on. You're the **first to deliver** — everyone else needs your backend running before they can integrate.

---

## Sprint 0 — Days 1–4 (PRIORITY)

- [ ] **FastAPI project structure**
  - Folder layout: `app/routers/`, `app/services/`, `app/models/`, `app/schemas/`, `app/config.py`
  - CORS middleware (allow React Native dev server)
  - Global error handling middleware
  - `requirements.txt` with initial deps: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `psycopg2-binary`, `python-jose`, `bcrypt`, `pydantic`

- [ ] **PostgreSQL + PostGIS**
  - `docker-compose.yml` with `postgres:15-postgis` + app service + Ollama service
  - Alembic init + first migration (User table)
  - `.env.example` with all required vars

- [ ] **Authentication system**
  - `POST /api/auth/register` — email, password → create user, return tokens
  - `POST /api/auth/login` — email, password → verify, return JWT access + refresh token
  - `POST /api/auth/refresh` — refresh token → new access token
  - Password hashing with bcrypt
  - JWT access token (15 min) + refresh token (7 days)
  - `get_current_user` dependency for protected routes

- [ ] **Git repository setup**
  - Init repo, `.gitignore`, `README.md`, branch structure (`main` → `develop`)
  - PR template (see [contributing.md](../contributing.md))
  - Add team members as collaborators
  - Protect `main` and `develop` branches (require PR + 1 approval)

---

## Sprint 1

- [ ] **User profile endpoints**
  - `GET /api/users/me` — return profile data
  - `PUT /api/users/me` — update name, age, weight, height, fitness level
  - `PUT /api/users/me/goals` — update weight goals and restrictions
  - Pydantic schemas for request/response validation

- [ ] **Docker setup**
  - `Dockerfile` for FastAPI app
  - `docker-compose.yml`: PostgreSQL + PostGIS, FastAPI, Ollama
  - Volume for DB persistence
  - Healthchecks

- [ ] **API documentation**
  - FastAPI auto-generates Swagger at `/docs` — ensure all endpoints have descriptions
  - Add example request/response bodies in schemas

---

## Sprint 2–3

- [ ] **CI/CD Pipeline** (GitHub Actions)
  - `backend-ci.yml`: on PR to `develop` → lint (ruff), run tests (pytest), check types
  - `deploy.yml`: on merge to `main` → build Docker image, deploy (Render / Railway / VPS)
  - Badge in README

- [ ] **Integration tests**
  - Test auth flow end-to-end (register → login → access protected route)
  - Test profile CRUD
  - Use `pytest` + `httpx.AsyncClient` + test DB

- [ ] **Code review & support**
  - Review PRs from all members
  - Help debug backend issues
  - Monitor CI pipeline

---

## Key Files You Own

```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── routers/auth.py
│   ├── routers/users.py
│   ├── services/auth_service.py
│   ├── models/user.py
│   └── schemas/user.py
├── alembic/
├── tests/
├── Dockerfile
├── requirements.txt
└── .env.example
docker-compose.yml
.github/workflows/
```

---

## User Stories Covered

- US-05 (API side): Personalized profile
- US-10 (API side): Weight goals and restrictions

---

## Definition of Done

- [ ] Backend starts with `docker-compose up`
- [ ] Auth endpoints work (tested with Postman/httpx)
- [ ] Alembic migrations run cleanly
- [ ] CI pipeline passes on every PR
- [ ] Swagger docs accessible at `/docs`
- [ ] Minimum 5 commits with meaningful messages
