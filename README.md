<div align="center">

# FitPlus

**Your AI-powered fitness companion — workouts, nutrition & gym discovery in one app.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Ollama](https://img.shields.io/badge/AI-Ollama%20(Local%20LLM)-000000?logo=ollama&logoColor=white)](https://ollama.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Documentation](#-documentation) · [Team](#-team)

</div>

---

## About

FitPlus is a mobile application that helps users monitor their physical activity and nutrition through **two AI agents** — a **Workout Trainer** and a **Diet Counselor** — both powered by locally-running language models via Ollama. The app also aggregates gym information (locations, prices, equipment, reviews) and allows users to purchase memberships directly.

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
│PostgreSQL│ │ Stripe │    │  Ollama   │    │PostgreSQL│
│+ PostGIS │ │  API   │    │ Local LLM │    │  (Users) │
└──────────┘ └────────┘    └───────────┘    └──────────┘
```

For detailed diagrams (UML, component architecture, workflows), see the [Architecture Documentation](docs/arhitecture.md).

---

## Documentation

| Document                                            | Description |
|-----------------------------------------------------|-------------|
| [Backlog & User Stories](docs/backlog.md)           | All 17 user stories, prioritized backlog with 21 tasks |
| [Architecture & Diagrams](docs/architecture.md)     | UML diagrams, component architecture, workflows, ER diagram |
| [Task Distribution](docs/task_distribution.md)      | Overview of who does what — links to individual task sheets |
| [Contributing & Git Workflow](docs/contributing.md) | Branch strategy, PR process, commit conventions |
| [AI Tools Report](docs/ai_tools_report.md)          | How AI tools were used throughout development |

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
| AI / LLM | Ollama (Mistral 7B / Llama 3 8B) |
| CI/CD | GitHub Actions |
| Containerization | Docker + docker-compose |

---

## Team

| Member | Role | Key Responsibilities |
|--------|------|---------------------|
| **Membru 1** | Backend Lead | FastAPI, PostgreSQL, Auth, CI/CD pipeline |
| **Membru 2** | Frontend Lead | React Native, Navigation, UI components, Chat UI |
| **Membru 3** | Gym Module Owner | PostGIS, Maps integration, Reviews, Favorites |
| **Membru 4** | Payments + AI | Stripe integration, Workout AI Agent, Ollama setup |
| **Membru 5** | Health + AI | Diet preferences, Prescriptions, Diet AI Agent, Evals |

---

## License

This project is developed for educational purposes as part of the *Software development methods* university course.
