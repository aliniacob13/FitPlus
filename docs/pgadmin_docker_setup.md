git # pgAdmin via Docker Compose

[← Back to README](../README.md)

---

## Goal

Run pgAdmin together with Postgres/Backend using one command, then connect to `fitplus_db` without host auth issues.

---

## 1) Configure `.env`

In project root (`FitPlus/.env`), ensure these values exist:

```env
POSTGRES_PORT=5433
POSTGRES_USER=fitplus
POSTGRES_PASSWORD=fitplus_secret
POSTGRES_DB=fitplus_db

PGADMIN_PORT=5050
PGADMIN_DEFAULT_EMAIL=admin@fitplus.com
PGADMIN_DEFAULT_PASSWORD=admin123
```

Notes:
- `POSTGRES_PORT=5433` is recommended to avoid clashes with local PostgreSQL on `5432`.
- pgAdmin email must be a valid format (for example `@fitplus.com`).

---

## 2) Start all services

From project root:

```bash
docker-compose down
docker-compose up --build
```

This starts:
- `fitplus_db`
- `fitplus_backend`
- `fitplus_pgadmin`

---

## 3) Open pgAdmin

Browser URL:

- `http://localhost:5050`

Login:
- Email: value from `PGADMIN_DEFAULT_EMAIL`
- Password: value from `PGADMIN_DEFAULT_PASSWORD`

---

## 4) Register database server in pgAdmin

In pgAdmin:

1. Right click `Servers`
2. `Register` -> `Server...`

### General tab
- Name: `FitPlus DB` (or any name)

### Connection tab
- Host name/address: `fitplus_db`
- Port: `5432`
- Maintenance database: `fitplus_db`
- Username: `fitplus`
- Password: `fitplus_secret`
- Save password: enabled

Click `Save`.

---

## 5) Quick verification

In pgAdmin tree:

- `Servers -> FitPlus DB -> Databases -> fitplus_db -> Schemas -> public -> Tables`

You should see tables like `users`, `gyms`.

Optional terminal check:

```bash
docker exec -it fitplus_db psql -U fitplus -d fitplus_db -c "select current_user, current_database();"
```

---

## Common issues

- **pgAdmin keeps restarting with invalid email**
  - Use valid `PGADMIN_DEFAULT_EMAIL` (example: `admin@fitplus.com`)
  - Recreate pgAdmin container:
    ```bash
    docker-compose stop pgadmin
    docker-compose rm -f pgadmin
    docker-compose up -d pgadmin
    ```

- **No tables shown**
  - Check backend migrations:
    ```bash
    docker-compose logs --tail=120 backend
    ```
  - Ensure Alembic upgrade finished without errors.

---

## Stop / cleanup

Stop services:

```bash
docker-compose down
```

Remove services and volumes (warning: deletes local DB data):

```bash
docker-compose down -v
```
# pgAdmin via Docker Compose

[← Back to README](../README.md)

---

## Why this setup

Using pgAdmin in Docker avoids host authentication issues and makes DB access consistent for all teammates.

---

## Prerequisites

- Docker Desktop running
- Project root opened (`FitPlus`)
- `.env` file present in project root

---

## Required `.env` variables

At minimum, ensure these values exist in root `.env`:

```env
POSTGRES_PORT=5433
POSTGRES_USER=fitplus
POSTGRES_PASSWORD=fitplus_secret
POSTGRES_DB=fitplus_db

PGADMIN_PORT=5050
PGADMIN_DEFAULT_EMAIL=admin@fitplus.com
PGADMIN_DEFAULT_PASSWORD=admin123
```

Notes:
- `POSTGRES_PORT=5433` is recommended to avoid conflicts with local PostgreSQL on `5432`.
- Use a valid email format for `PGADMIN_DEFAULT_EMAIL` (e.g. `@fitplus.com`, not `@fitplus.local`).

---

## Start services

From project root:

```bash
docker-compose down
docker-compose up --build
```

This starts:
- `fitplus_db`
- `fitplus_backend`
- `fitplus_pgadmin`

---

## Open pgAdmin

In browser:

- `http://localhost:5050`

Login with:

- Email: value from `PGADMIN_DEFAULT_EMAIL`
- Password: value from `PGADMIN_DEFAULT_PASSWORD`

---

## Register FitPlus database server in pgAdmin

1. Right click `Servers`
2. `Register` -> `Server...`

### General tab

- Name: `FitPlus DB` (or any name)

### Connection tab

- Host name/address: `fitplus_db`
- Port: `5432`
- Maintenance database: `fitplus_db`
- Username: `fitplus`
- Password: `fitplus_secret`
- Save password: enabled

Click `Save`.

---

## Quick verification

In pgAdmin:

- Expand `Servers -> FitPlus DB -> Databases -> fitplus_db -> Schemas -> public -> Tables`
- You should see tables like `users`, `gyms`

Optional terminal check:

```bash
docker exec -it fitplus_db psql -U fitplus -d fitplus_db -c "select current_user, current_database();"
```

---

## Common issues

- **pgAdmin container restarts with invalid email**
  - Set `PGADMIN_DEFAULT_EMAIL` to a valid email (example: `admin@fitplus.com`)
  - Recreate container:
    ```bash
    docker-compose stop pgadmin
    docker-compose rm -f pgadmin
    docker-compose up -d pgadmin
    ```

- **Cannot connect from host pgAdmin but Docker pgAdmin works**
  - Prefer Docker pgAdmin (`fitplus_db:5432`) for team consistency.

- **No tables visible**
  - Ensure backend migration ran:
    ```bash
    docker-compose logs --tail=100 backend
    ```
  - Look for Alembic migration logs without errors.

---

## Teardown

Stop services:

```bash
docker-compose down
```

Remove services + volumes (warning: deletes local DB data):

```bash
docker-compose down -v
```
