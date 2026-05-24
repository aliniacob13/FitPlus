<div align="center">

# FitPlus

**Your AI-powered fitness companion — workouts, nutrition & gym discovery in one app.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Anthropic](https://img.shields.io/badge/LLM-Anthropic%20API-D4A574?logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Documentation](#-documentation) · [Team](#-team)

</div>

---

## About

FitPlus is a mobile application that helps users monitor their physical activity and nutrition through **AI-assisted features** — including a **Workout Trainer** and a **Diet Counselor** chat — backed by **cloud LLM APIs** (in our setup: **Anthropic**, via `ANTHROPIC_API_KEY` / configurable `LLM_PROVIDER`). The app also aggregates gym information (locations, prices, equipment, reviews), supports **nutrition logging** (food diary, label scan, plate coach), and allows users to purchase memberships via **Stripe**.

---

## Features

### Gym Discovery
- Interactive map with nearby gyms based on your GPS location
- Detailed gym profiles: hours, equipment, pricing, ratings
- Smart recommendations based on budget, distance & equipment preferences
- Save favorite gyms and leave reviews with photos

### Memberships & Payments
- Browse and compare gym membership plans
- Secure checkout via Stripe
- Manage active subscriptions directly in-app

### AI Workout Trainer
- Personalized exercise recommendations by muscle group
- Step-by-step workout generation based on your goals
- Adapts to your energy level and fitness capabilities
- Progressive difficulty based on workout history

### AI Diet Counselor
- Meal suggestions tailored to your dietary preferences, allergies & budget
- Grocery list generation with precise nutritional targets
- Supports uploaded health prescriptions from nutritionists
- Remembers your preferences across conversations

### Nutrition & food diary
- Daily calorie target from profile (TDEE-style calculator), persisted on the user
- Food search (USDA FoodData Central) and manual logging with day totals
- **Nutrition label scan:** camera/gallery → OCR + parser → suggested food entry
- **Plate coach (vision):** photo of a meal → AI estimates items and calories; clarifying follow-ups in chat

### User Profile
- Personal fitness profile with goals and restrictions
- Weight tracking and progress monitoring
- Diet preferences and allergy management

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Native App                  │
│            (Expo + TypeScript + Zustand)              │
├──────────┬──────────┬───────────┬───────────┬────────┤
│  Map &   │ Payments │ Workout   │  Diet     │Profile │
│  Gyms    │ & Subs   │ AI Chat   │  AI Chat  │& Auth  │
└────┬─────┴────┬─────┴─────┬─────┴─────┬─────┴───┬────┘
     │          │           │           │          │
     ▼          ▼           ▼           ▼          ▼
┌─────────────────────────────────────────────────────┐
│               FastAPI Backend (Python)                │
├──────────┬──────────┬───────────┬───────────┬────────┤
│ Gym API  │ Stripe   │ Workout   │  Diet     │Auth    │
│ (PostGIS)│ Payments │ Agent     │  Agent    │(JWT)   │
└────┬─────┴────┬─────┴─────┬─────┴─────┬─────┴───┬────┘
     │          │           │           │          │
     ▼          ▼           └─────┬─────┘          ▼
┌──────────┐ ┌────────┐    ┌─────▼─────┐    ┌──────────┐
│PostgreSQL│ │ Stripe │    │  API Keys │    │PostgreSQL│
│+ PostGIS │ │  API   │    │           │    │  (Users) │
└──────────┘ └────────┘    └───────────┘    └──────────┘
```

For detailed diagrams (UML, component architecture, workflows), see the [Architecture Documentation](docs/arhitecture.md).

---

## Documentation

| Document                                            | Description |
|-----------------------------------------------------|-------------|
| [Course rubric report (SDM + AI)](docs/course_rubric_report.md) | Rubric mapping: user stories, diagrams, Git, tests/evals, bug+PR, CI/CD, AI tools report — links to detailed pages |
| [Backlog & User Stories](docs/backlog.md)           | User stories (≥10), sprint backlog + nutrition extensions |
| [Architecture & Diagrams](docs/arhitecture.md)    | Mermaid diagrams: system, ER-style, API, agent workflows |
| [Task Distribution](docs/task_distribution.md)      | Overview of who does what — links to individual task sheets |
| [Contributing & Git Workflow](docs/contributing.md) | Branch strategy, PR process, commit conventions |
| [Testing & CI](docs/testing.md)                     | Pytest, Ruff, agent evals, GitHub Actions, mobile lint/Jest |
| [AI Tools Report](docs/ai_tools_report.md)          | How AI tools were used throughout development |
| [pgAdmin Docker Setup](docs/pgadmin_docker_setup.md) | One-command setup for pgAdmin + DB access |
| [Run Project Guide](docs/run_project_guide.md)      | End-to-end commands: DB, backend, frontend, testing |

### Individual Task Sheets

| Member   | Module | Task Sheet                                    |
|----------|--------|-----------------------------------------------|
| Member 1 | Backend Core, Auth & CI/CD | [→ tasks/member1.md](docs/tasks/member1.md)  |
| Member 2 | Frontend Core, UI & Chat Component | [→ tasks/member2.md](docs/tasks/member2.md) |
| Member 3 | Gym Discovery, Map & Reviews | [→ tasks/member3.md](docs/tasks/member3.md) |
| Member 4 | Payments & Workout AI Agent | [→ tasks/member4.md](docs/tasks/member4.md) |
| Member 5 | Health Data & Diet AI Agent | [→ tasks/member5.md](docs/tasks/member5.md) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo) + TypeScript |
| State Management | Zustand |
| Navigation | React Navigation |
| Maps | react-native-maps + expo-location |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + PostGIS |
| Migrations | Alembic |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe Checkout |
| AI / LLM | Anthropic API (Claude) — same `LLMService` layer can use OpenAI; keys in `.env` |
| CI/CD | GitHub Actions |
| Containerization | Docker + docker-compose |

---

## Team

| Member | Role | Key Responsibilities |
|--------|------|---------------------|
| **Member 1** | Backend Lead | FastAPI, PostgreSQL, Auth, CI/CD pipeline |
| **Member 2** | Frontend Lead | React Native, Navigation, UI components, Chat UI |
| **Member 3** | Gym Module Owner | PostGIS, Maps integration, Reviews, Favorites |
| **Member 4** | Payments + AI | Stripe integration, Workout AI Agent, LLM provider setup |
| **Member 5** | Health + AI | Diet preferences, Prescriptions, Diet AI Agent, Evals |

---

## License

This project is developed for educational purposes as part of the *Software development methods* university course.
