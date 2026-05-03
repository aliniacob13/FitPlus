# Member 4 — Payments & Workout AI Agent (Full-stack)

[← Task Distribution](../task_distribution.md) · [← README](../../README.md)

---

## Role

You handle two independent sub-modules: **Stripe payments** (smaller) and the **Workout AI Agent** (bigger). You also set up the shared **LLM infrastructure** (Ollama + `LLMService`) that M5 reuses for the Diet Agent.

---

## Sprint 0 — Days 1–4

- [ ] **Research & setup Stripe**
  - Create Stripe test account, get `sk_test_` and `pk_test_` keys
  - Install `stripe` Python package
  - Understand Checkout Session flow: create session → redirect → webhook confirms

- [ ] **Research & setup Ollama**
  - Test Ollama locally: `ollama pull mistral` → `ollama run mistral`
  - Test API: `curl http://localhost:11434/api/chat`
  - Draft initial system prompt for Workout Trainer agent
  - Evaluate models: Mistral 7B vs Llama 3 8B vs Phi-3 (pick the most responsive)

- [ ] **Database models** (shared with M5)
  - `Conversation` model: id, user_id (FK), agent_type (`workout` | `diet`), created_at, updated_at
  - `Message` model: id, conversation_id (FK), role (`user` | `assistant`), content, created_at
  - Write Alembic migration

---

## Sprint 1

### Payments — Backend

- [ ] **Stripe checkout endpoint**
  - `POST /api/payments/checkout` — body: `{ gym_id, plan_type }`
  - Creates Stripe Checkout Session with line items from gym pricing
  - Returns `{ checkout_url }` → frontend opens in browser

- [ ] **Stripe webhook**
  - `POST /api/payments/webhook` — receives Stripe events
  - On `checkout.session.completed`: create Subscription record in DB
  - Verify webhook signature for security

- [ ] **Subscription model & endpoints**
  - `Subscription` model: id, user_id, gym_id, plan_type, status, start_date, end_date, stripe_subscription_id
  - `GET /api/users/me/subscriptions` — list active subscriptions
  - `POST /api/subscriptions/cancel` — cancel subscription (update Stripe + DB)

### LLM Infrastructure (shared) — Backend

- [ ] **`LLMService` class** (`backend/app/services/llm_service.py`)
  ```python
  class LLMService:
      async def generate(self, system_prompt: str, messages: list, user_context: dict) -> str:
          # Calls Ollama API
          # Injects user_context into system prompt
          # Sends conversation history
          # Returns generated text
  ```
  - Configurable model name via env var `LLM_MODEL`
  - Timeout handling (LLMs can be slow)
  - Error handling (Ollama not running, model not loaded)

---

## Sprint 2

### Workout AI Agent — Backend

- [ ] **System prompt** for Workout Trainer
  - Role: expert fitness trainer
  - Capabilities: knows exercises, muscle groups, rep ranges, rest times, progressions
  - Rules: always ask about energy level, respect user's fitness level, suggest warm-up
  - Format: structured workout plans when asked

- [ ] **Context injection**
  - Before each LLM call, fetch and inject:
    - User profile: age, weight, height, fitness level, goals
    - Last 3 workouts from conversation history (for progressive difficulty — US-15)
  - Format as structured text in the system prompt

- [ ] **Workout agent endpoints**
  - `POST /api/ai/workout/chat` — body: `{ message, conversation_id? }`
    - If no conversation_id → create new conversation
    - Fetch history, call LLM, save both messages, return response
  - `GET /api/ai/workout/conversations` — list conversations for current user
  - `GET /api/ai/workout/conversations/{id}` — get all messages in a conversation

### Payments — Frontend

- [ ] **Plans & Pricing screen**
  - Shows available plans for a gym (data from `GET /api/gyms/{id}/plans`)
  - Card layout: plan name, price, duration, features
  - "Subscribe" button on each card

- [ ] **Payment flow**
  - Tap "Subscribe" → call `POST /api/payments/checkout` → open `checkout_url` in `expo-web-browser`
  - On return: check subscription status, update UI
  - Show "Active" badge on gym if user has subscription

- [ ] **My Subscriptions screen**
  - List active subscriptions with gym name, plan, expiry date
  - "Cancel" button with confirmation modal
  - Show payment history (optional)

---

## Sprint 3

### Workout AI — Frontend Connection

- [ ] **Connect Workout chat to backend**
  - Use M2's `ChatScreen` component
  - Configure quick actions: "Chest day", "Full body 45min", "I'm tired today", "What should I train?"
  - Pass `agent_type = "workout"` to API calls
  - Test conversation flow end-to-end

- [ ] **Tests**
  - Backend: test Stripe checkout session creation (mock Stripe)
  - Backend: test workout agent returns relevant exercises
  - Backend: test conversation history is maintained
  - Test that LLMService handles Ollama being offline gracefully

---

## Key Files You Own

```
backend/app/
├── routers/payments.py
├── routers/ai.py          (workout endpoints)
├── services/payment_service.py
├── services/llm_service.py     ← SHARED with M5
├── services/workout_agent.py
├── models/subscription.py
├── models/conversation.py      ← SHARED with M5
└── schemas/payment.py, ai.py

frontend/src/
├── screens/
│   ├── payments/PlansScreen.tsx
│   ├── payments/MySubscriptionsScreen.tsx
│   └── chat/WorkoutChatScreen.tsx  (wraps M2's ChatScreen)
```

---

## User Stories Covered

- US-04: Purchase gym membership
- US-07: Exercises for specific muscle group
- US-08: Step-by-step workouts
- US-09: Adjust workout to energy level
- US-15: Progressive difficulty from history

---

## Definition of Done

- [ ] Can complete a test payment via Stripe Checkout
- [ ] Subscription appears in user's account after payment
- [ ] Workout AI responds with relevant exercises and plans
- [ ] AI adapts based on user's stated energy level
- [ ] Conversation history persists between sessions
- [ ] `LLMService` is generic and reusable by M5
- [ ] Minimum 5 commits with meaningful messages
