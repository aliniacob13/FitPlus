# Task Distribution

[← Back to README](../README.md)

---

## Overview

The project is split into 5 modules, each owned by one team member. Members 1 & 2 deliver the foundation (Sprint 0), then Members 3, 4, 5 work in parallel on their feature modules.

```
                    SPRINT 0
         ┌──────────────────────────┐
         │  M1: Backend Core        │
         │  M2: Frontend Core       │
         └──────────┬───────────────┘
                    │
        ┌───────────┼───────────────┐
        ▼           ▼               ▼
   ┌─────────┐ ┌──────────┐  ┌──────────┐
   │ M3: Gym │ │M4: Pay + │  │M5: Health│
   │ & Map   │ │Workout AI│  │+ Diet AI │
   └─────────┘ └────┬─────┘  └────┬─────┘
                    │  LLMService  │
                    │◄────────────►│
                    │   (shared)   │
                    ▼              ▼
              M2: Chat UI (reusable component)
```

---

## Module Assignment

| Member | Primary Module | Secondary Module | Task Sheet                          |
|--------|---------------|-----------------|-------------------------------------|
| **Member 1** | Backend infrastructure, Auth, CI/CD | Code review, deploy | [📄 member1.md](tasks/member1.md)   |
| **Member 2** | Frontend core, shared UI, Chat component | Home screen, polish | [📄 member2.md](tasks/member2.md) |
| **Member 3** | Gym database, Map, Favorites, Reviews | Gym recommendations | [📄 member3.md](tasks/member3.md) |
| **Member 4** | Stripe Payments + Workout AI Agent | LLM provider setup (Anthropic) | [📄 member4.md](tasks/member4.md) |
| **Member 5** | Health data, Prescriptions + Diet AI Agent | Agent evals (both) | [📄 member5.md](tasks/member5.md) |

---

## Sprint Timeline

| Sprint | M1 | M2 | M3 | M4 | M5 |
|--------|----|----|----|----|-----|
| **S0** (days 1–4) | FastAPI + DB + Auth + Docker + CI/CD | RN + Nav + State + Auth screens | Gym DB models, seed data | Research Stripe + LLM API keys | Research LLM, Health DB models |
| **S1** (week 1) | Profile endpoints, Swagger docs | Profile screens, API layer, shared components | Nearby API + map with pins | Stripe checkout + webhook, workout system prompt | Diet preferences API, prescriptions upload |
| **S2** (week 2) | Code review, integration tests | Chat UI component, Home screen | Gym detail, favorites, reviews | Workout agent + wired chat | Diet agent + wired chat |
| **S3** (week 3) | Final deploy, optimizations | Polish UI, dark mode | Map polish, filters, tests | Subscriptions UI, workout agent tests | Evals for both agents, weight tracker UI |

---

## Common Responsibilities (all members)

- **Git discipline**: minimum 5 commits per person, feature branches, PRs with at least 1 reviewer
- **Testing**: each member writes tests for their own module
- **Bug reporting**: file GitHub Issues for bugs found in other modules, fix via PR
- **AI report**: document all AI tool usage (what was generated, what was manually adjusted)
