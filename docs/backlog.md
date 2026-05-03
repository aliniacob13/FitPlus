# Backlog & User Stories

[← Back to README](../README.md)

---

## User Stories

### Gym Discovery

| ID | User Story | Assigned To |
|----|-----------|-------------|
| US-01 | As a user, I want to view a map of gyms near my current location so that I can find a convenient place to work out. | Member 3 |
| US-02 | As a user, I want to see details about a gym (opening hours, equipment) when clicking on it on the map. | Member 3    |
| US-03 | As a user, I want to get gym recommendations based on criteria, so I can choose the one that fits me best. | Member 3    |
| US-13 | As a user, I want to save gyms I visit frequently to a favorites list. | Member 3    |
| US-14 | As a user, I want to leave a review and pictures of the gyms. | Member 3    |

### Memberships & Payments

| ID | User Story | Assigned To |
|----|-----------|-------------|
| US-04 | As a user, I want to manage and purchase my gym membership directly from the app. | Member 4    |

### Profile & Health Data

| ID     | User Story                                                                                                                   | Assigned To                    |
|--------|------------------------------------------------------------------------------------------------------------------------------|--------------------------------|
| US-05  | As a user, I want the app to create a personalized profile that fits my goals and personal information.                      | Member 1 (API) + Member 2 (UI) |
| US-10  | As a user, I want to store my weight goals and restrictions directly into the app.                                           | Member 1 (API) + Member 2 (UI) |
| US-16  | As a user, I want to tell my diet AI about my food preferences, allergies and budget so that it can recommend suitable meals. | Member 5                       |
| US-17  | As a user, I want to upload health prescriptions from my nutritionist so the AI knows my dietary needs.                      | Member 5                       |

### AI Workout Trainer

| ID | User Story | Assigned To |
|----|-----------|-------------|
| US-06 | As a user, I want the app to recommend personalized workouts that fit my profile. | Member 4    |
| US-07 | As a user, I want an AI Agent to tell me which exercises work better for a specific muscle group. | Member 4    |
| US-08 | As a user, I want the AI Agent to recommend step-by-step workouts based on my requests. | Member 4    |
| US-09 | As a user, I want the AI to adjust my workout based on my energy levels and fitness capabilities. | Member 4    |
| US-15 | As a user, I want the fitness AI to remember my previous workouts so it can progressively increase difficulty. | Member 4    |

### AI Diet Counselor

| ID | User Story | Assigned To |
|----|-----------|-------------|
| US-06 | As a user, I want the app to recommend diets that fit my profile. | Member 5    |
| US-11 | As a user, I want to get meal suggestions from a specific AI so I can achieve my goals. | Member 5    |
| US-12 | As a user, I want the AI to generate a grocery list with the exact nutrients needed for my workouts. | Member 5    |

---

## Development Backlog

Tasks ordered by execution priority. Dependencies are marked.

### Sprint 0 — Foundation (Days 1–4)

| # | Task | Owner    | Depends On |
|---|------|----------|------------|
| 1 | Set up FastAPI project structure (Router / Service / Model layers) | Member 1 | — |
| 2 | Set up PostgreSQL database with PostGIS extension + Alembic migrations | Member 1 | — |
| 3 | Implement authentication (register, login, JWT tokens) | Member 1 | #1, #2 |
| 4 | Set up React Native (Expo) + TypeScript project | Member 2 | — |
| 5 | Set up Navigation Tab Bar (React Navigation) | Member 2 | #4 |
| 6 | Set up global state management (Zustand) | Member 2 | #4 |

### Sprint 1 — Core Features

| # | Task | Owner    | Depends On |
|---|------|----------|------------|
| 7 | Build shared UI component library + Auth screens + Profile screens | Member 2 | #5, #6 |
| 8 | Create Gym database with PostGIS location data + seed data | Member 3 | #2 |
| 9 | Build `GET /api/gyms/nearby` endpoint using PostGIS `ST_DWithin` | Member 3 | #8 |
| 10 | Set up Stripe in backend, build checkout session endpoint | Member 4 | #1 |
| 11 | Create Subscriptions database table (user ↔ subscription ↔ gym) | Member 4 | #2 |
| 12 | Integrate `react-native-maps` + request location permissions | Member 3 | #4 |

### Sprint 2 — Integration

| # | Task | Owner    | Depends On |
|---|------|----------|------------|
| 13 | Connect map screen to `/api/gyms/nearby`, render pins | Member 3 | #9, #12 |
| 14 | Build gym detail view (bottom sheet on pin tap) | Member 3 | #13 |
| 15 | Build subscription plans & pricing UI | Member 4 | #7, #10 |
| 16 | Integrate frontend payment flow (Stripe Checkout → confirmation) | Member 4 | #15, #11 |
| 17 | Set up LLM provider in FastAPI (Ollama + `LLMService` wrapper) | Member 4 | #1 |
| 18a | Build Workout AI Agent (system prompt, context injection, endpoints) | Member 4 | #17 |
| 18b | Build Diet AI Agent (system prompt, context injection, endpoints) | Member 5 | #17 |
| 19 | Create conversation history database (Conversation + Message models) | Member 4 | #2 |

### Sprint 3 — Polish & Delivery

| # | Task                                                             | Owner    | Depends On |
|---|------------------------------------------------------------------|----------|------------|
| 20 | Build reusable Chat UI component, connect to both agent backends | Member 2 | #18a, #18b |
| 21 | Add loading state ("...") while waiting for AI response          | Member 2 | #20 |
| — | Favorites & Reviews system (backend + frontend)                  | Member 3 | #14 |
| — | Diet preferences & prescriptions upload (backend + frontend)     | Member 5 | #2, #7 |
| — | Agent evals (automated test prompts for both agents)             | Member 5 | #18a, #18b |
| — | CI/CD pipeline (GitHub Actions: lint, test, build, deploy)       | Member 1 | #1 |
| — | Final polish: dark mode, animations, error handling              | Member 2 | all |
