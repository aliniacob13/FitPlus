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
   │ & Hartă │ │Workout AI│  │+ Diet AI │
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
| **Membru 1** | Backend infrastructure, Auth, CI/CD | Code review, deploy | [📄 member1.md](tasks/member1.md)   |
| **Membru 2** | Frontend core, shared UI, Chat component | Home screen, polish | [📄 member2.md](tasks/member2.md) |
| **Membru 3** | Gym database, Map, Favorites, Reviews | Gym recommendations | [📄 member3.md](tasks/member3.md) |
| **Membru 4** | Stripe Payments + Workout AI Agent | Ollama/LLM setup | [📄 member4.md](tasks/member4.md) |
| **Membru 5** | Health data, Prescriptions + Diet AI Agent | Agent evals (both) | [📄 member5.md](tasks/member5.md) |

---

## Sprint Timeline

| Sprint | M1 | M2 | M3 | M4 | M5 |
|--------|----|----|----|----|-----|
| **S0** (zile 1–4) | FastAPI + DB + Auth + Docker + CI/CD | RN + Nav + State + Auth screens | Modele Gym DB, seed data | Research Stripe + Ollama setup | Research LLM, modele Health DB |
| **S1** (săpt 1) | Profil endpoints, Swagger docs | Profil screens, API layer, componente shared | API nearby + hartă cu pins | Stripe checkout + webhook, system prompt workout | Diet preferences API, prescriptions upload |
| **S2** (săpt 2) | Code review, teste integrare | Chat UI component, Home screen | Detalii sală, favorite, review-uri | Workout agent complet + chat conectat | Diet agent complet + chat conectat |
| **S3** (săpt 3) | Deploy final, optimizări | Polish UI, dark mode | Polish hartă, filtre, teste | Abonamente UI, teste workout agent | Evals ambii agenți, weight tracker UI |

---

## Common Responsibilities (all members)

- **Git discipline**: minimum 5 commits per person, feature branches, PRs with at least 1 reviewer
- **Testing**: each member writes tests for their own module
- **Bug reporting**: file GitHub Issues for bugs found in other modules, fix via PR
- **AI report**: document all AI tool usage (what was generated, what was manually adjusted)
