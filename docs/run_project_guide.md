git # Run Project Guide (Backend + Mobile/Web + DB)

[← Back to README](../README.md)

---

## Purpose

This guide is the single source of truth for running FitPlus locally, for all teammates:
- database
- backend API
- frontend (Expo: web + mobile)
- smoke tests and quick verification

---

## Prerequisites

Install these once:
- Docker Desktop (running)
- Node.js 20+ and npm
- Python 3.12+ (only if you run backend outside Docker)
- Expo Go app on phone (for mobile testing)

Verify:

```bash
docker --version
docker compose version
node -v
npm -v
```

---

## 1) Environment setup

From repository root:

```bash
cp .env.example .env
```

Open `.env` and set values. Minimum required for local run:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT` (default `5432`)
- `SECRET_KEY`
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`

Optional:
- `GOOGLE_MAPS_API_KEY` (for real Places data; without it, fallback data can be used)

---

## 2) Start DB + Backend + pgAdmin (Docker)

From repository root:

```bash
docker compose up --build
```

This starts:
- `fitplus_db` (PostgreSQL + PostGIS)
- `fitplus_backend` (FastAPI, runs Alembic migrations on startup)
- `fitplus_pgadmin` (DB GUI)

Stop services:

```bash
docker compose down
```

Reset services + volumes (warning: deletes DB data):

```bash
docker compose down -v
```

---

## 3) Start frontend (Expo app from `mobile`)

Open a second terminal:

```bash
cd mobile
npm install
npx expo start --clear
```

Then choose:
- `w` for web
- scan QR with Expo Go for phone
- `a` for Android emulator
- `i` for iOS simulator (Mac only)

Important:
- Frontend source of truth is `mobile`, not `frontend`.
- Keep `EXPO_PUBLIC_API_BASE_URL` configured for your machine/network.

---

## 4) Service URLs

Default local URLs:
- Backend API: `http://localhost:8000`
- OpenAPI Swagger: `http://localhost:8000/docs`
- pgAdmin: `http://localhost:5050`

For frontend web, Expo prints the URL in terminal (usually `http://localhost:19006` or similar).

---

## 5) Quick functional test flow

## 5.1 Backend health

```bash
curl http://localhost:8000/health
```

Expected: JSON response with service health.

## 5.2 Register user

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@fitplus.com\",\"password\":\"Secret123!\"}"
```

Expected:
- `access_token`
- `refresh_token`
- `token_type`

## 5.3 Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@fitplus.com\",\"password\":\"Secret123!\"}"
```

Save `access_token` for protected endpoints.

## 5.4 Get profile (`/users/me`)

```bash
curl "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Expected: real user profile from DB.

## 5.5 Nearby gyms (DB endpoint)

```bash
curl "http://localhost:8000/api/v1/gyms/nearby?latitude=44.4268&longitude=26.1025&radius_m=5000"
```

Expected: list of gyms with distance.

## 5.6 Places endpoint (Google + fallback)

```bash
curl "http://localhost:8000/api/v1/places/nearby?latitude=44.4268&longitude=26.1025&radius_m=5000"
```

Expected:
- real Places data if `GOOGLE_MAPS_API_KEY` is valid
- fallback/local data otherwise

---

## 6) Frontend verification checklist

After app launch (web + phone), verify:
- Auth:
  - Register works
  - Login works
  - Logout works
- Profile:
  - `/users/me` data is displayed
  - profile update saves and persists after refresh
- Map:
  - gyms list loads
  - gym detail opens
  - web map renders
  - directions link opens
- Scrolling:
  - pages scroll on web
  - pages scroll on mobile

---

## 7) DB verification

Use pgAdmin:
1. Open `http://localhost:5050`
2. Login with `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`
3. Register server:
   - Host: `fitplus_db`
   - Port: `5432`
   - DB: `fitplus_db`
   - User: `fitplus`
   - Password: from `.env`

Then inspect:
- `users`
- `gyms`
- Alembic migration state

For a dedicated pgAdmin walkthrough, see `docs/pgadmin_docker_setup.md`.

---

## 8) Common troubleshooting

- Backend not reachable on `:8000`
  - check `docker compose logs backend`
  - verify `.env` values
  - ensure no port conflict on `8000`

- DB auth errors
  - verify `.env` and running container env values
  - if needed: `docker compose down -v` then `docker compose up --build`

- Expo app still shows old UI/code
  - stop Metro
  - rerun `npx expo start --clear`
  - reload app on device/browser

- Web map issues
  - verify browser console
  - verify map screen web implementation and API responses from `/places/*`

---

## 9) Daily team workflow (recommended)

1. `git pull` on your branch
2. `docker compose up --build`
3. `cd mobile && npx expo start --clear`
4. run smoke tests from sections 5 and 6
5. commit small, focused changes
