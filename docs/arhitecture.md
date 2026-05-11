# Architecture & Diagrams

[← Back to README](../README.md)

This document contains **Mermaid** diagrams for system context, data model (ER-style), API surface, AI chat flow, and deployment. For the course rubric cross-reference, see [course_rubric_report.md](course_rubric_report.md).

## System Architecture

```mermaid
graph TB
    subgraph Mobile["React Native App (Expo + TypeScript)"]
        UI[UI Components]
        Nav[React Navigation]
        Store[Zustand Stores]
        API[API Service Layer]
    end

    subgraph Backend["FastAPI Backend"]
        Router[Routers]
        Service[Services]
        Models[SQLAlchemy Models]
        Auth[Auth Middleware - JWT]
        LLM[LLMService Wrapper]
    end

        subgraph Data["Data Layer"]
        PG[(PostgreSQL + PostGIS)]
        LLMCloud[LLM API — Anthropic / OpenAI]
        Stripe[Stripe API]
        FS[File Storage]
    end

    UI --> Nav
    Nav --> Store
    Store --> API
    API -->|HTTP/JSON| Router
    Router --> Auth
    Auth --> Service
    Service --> Models
    Models --> PG
    Service --> LLM
    LLM --> LLMCloud
    Service --> Stripe
    Service --> FS
```

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string password_hash
        datetime created_at
    }

    USER_PROFILE {
        uuid id PK
        uuid user_id FK
        string name
        int age
        float weight_kg
        float height_cm
        string fitness_level
        string goals
        json restrictions
    }

    GYM {
        uuid id PK
        string name
        string address
        point location
        json opening_hours
        json equipment
        json pricing_plans
        string image_url
        float avg_rating
    }

    GYM_REVIEW {
        uuid id PK
        uuid user_id FK
        uuid gym_id FK
        int rating
        text content
        json image_urls
        datetime created_at
    }

    FAVORITE_GYM {
        uuid id PK
        uuid user_id FK
        uuid gym_id FK
        datetime created_at
    }

    SUBSCRIPTION {
        uuid id PK
        uuid user_id FK
        uuid gym_id FK
        string plan_type
        string status
        date start_date
        date end_date
        string stripe_subscription_id
    }

    PAYMENT {
        uuid id PK
        uuid user_id FK
        decimal amount
        string currency
        string status
        string stripe_payment_id
        datetime created_at
    }

    DIET_PREFERENCE {
        uuid id PK
        uuid user_id FK
        json allergies
        string diet_style
        decimal daily_budget
        json restrictions
    }

    PRESCRIPTION {
        uuid id PK
        uuid user_id FK
        string file_url
        text notes
        datetime uploaded_at
    }

    CONVERSATION {
        uuid id PK
        uuid user_id FK
        string agent_type
        datetime created_at
        datetime updated_at
    }

    MESSAGE {
        uuid id PK
        uuid conversation_id FK
        string role
        text content
        datetime created_at
    }

    USER ||--|| USER_PROFILE : has
    USER ||--o{ GYM_REVIEW : writes
    USER ||--o{ FAVORITE_GYM : saves
    USER ||--o{ SUBSCRIPTION : holds
    USER ||--o{ PAYMENT : makes
    USER ||--|| DIET_PREFERENCE : sets
    USER ||--o{ PRESCRIPTION : uploads
    USER ||--o{ CONVERSATION : starts
    GYM ||--o{ GYM_REVIEW : receives
    GYM ||--o{ FAVORITE_GYM : "is in"
    GYM ||--o{ SUBSCRIPTION : "belongs to"
    CONVERSATION ||--o{ MESSAGE : contains
```

---

## API Endpoints Overview

```mermaid
graph LR
    subgraph Auth
        POST_register["POST /api/auth/register"]
        POST_login["POST /api/auth/login"]
        POST_refresh["POST /api/auth/refresh"]
    end

    subgraph Users
        GET_me["GET /api/users/me"]
        PUT_me["PUT /api/users/me"]
        PUT_goals["PUT /api/users/me/goals"]
        PUT_diet["PUT /api/users/me/diet-preferences"]
        POST_rx["POST /api/users/me/prescriptions"]
        GET_fav["GET /api/users/me/favorite-gyms"]
        GET_subs["GET /api/users/me/subscriptions"]
    end

    subgraph Gyms
        GET_nearby["GET /api/gyms/nearby"]
        GET_gym["GET /api/gyms/:id"]
        GET_recommend["GET /api/gyms/recommend"]
        POST_review["POST /api/gyms/:id/reviews"]
        GET_plans["GET /api/gyms/:id/plans"]
    end

    subgraph Payments
        POST_checkout["POST /api/payments/checkout"]
        POST_webhook["POST /api/payments/webhook"]
        POST_cancel["POST /api/subscriptions/cancel"]
    end

    subgraph AI
        POST_workout["POST /api/ai/workout/chat"]
        GET_workout_h["GET /api/ai/workout/conversations"]
        POST_diet["POST /api/ai/diet/chat"]
        GET_diet_h["GET /api/ai/diet/conversations"]
    end
```

---

## AI Agent Workflow

```mermaid
sequenceDiagram
    actor User
    participant App as React Native
    participant API as FastAPI
    participant DB as PostgreSQL
    participant LLM as LLM API (Anthropic / OpenAI)

    User->>App: Types message in chat
    App->>API: POST /api/ai/workout/chat
    API->>DB: Fetch user profile & goals
    API->>DB: Fetch conversation history (last N messages)
    API->>LLM: Send system prompt + context + history + user message
    LLM-->>API: Generated response
    API->>DB: Save user message + AI response
    API-->>App: Return AI response
    App-->>User: Display response in chat bubble
```

---

## Deployment Diagram

```mermaid
graph TB
    subgraph Client
        iOS[iOS Device]
        Android[Android Device]
    end

    subgraph Cloud["Cloud / VPS"]
        FastAPI[FastAPI Server]
        PG[(PostgreSQL + PostGIS)]
        LLMCloud[LLM API — Anthropic / OpenAI]
    end

    subgraph External
        StripeAPI[Stripe API]
        GH[GitHub Actions CI/CD]
    end

    iOS -->|HTTPS| FastAPI
    Android -->|HTTPS| FastAPI
    FastAPI --> PG
    FastAPI --> LLMCloud
    FastAPI --> StripeAPI
    GH -->|Deploy| FastAPI
```

---

## Directory Structure

```
fitplus/
├── README.md
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── gyms.py
│   │   │   ├── payments.py
│   │   │   └── ai.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── gym_service.py
│   │   │   ├── payment_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── workout_agent.py
│   │   │   └── diet_agent.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── gym.py
│   │   │   ├── subscription.py
│   │   │   ├── conversation.py
│   │   │   └── diet.py
│   │   └── schemas/
│   │       ├── user.py
│   │       ├── gym.py
│   │       └── ai.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── App.tsx
│   ├── app.json
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── map/
│   │   │   ├── gym/
│   │   │   ├── payments/
│   │   │   ├── chat/
│   │   │   └── profile/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── chat/
│   │   │   └── gym/
│   │   ├── navigation/
│   │   ├── store/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    ├── BACKLOG.md
    ├── ARCHITECTURE.md
    ├── TASK_DISTRIBUTION.md
    ├── CONTRIBUTING.md
    ├── AI_TOOLS_REPORT.md
    └── tasks/
        ├── MEMBER_1.md
        ├── MEMBER_2.md
        ├── MEMBER_3.md
        ├── MEMBER_4.md
        └── MEMBER_5.md
```
