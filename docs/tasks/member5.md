# Member 5 — Health Data & Diet AI Agent (Full-stack)

[← Task Distribution](../task_distribution.md) · [← README](../../README.md)

---

## Role

You handle user **health data** (diet preferences, allergies, prescriptions) and build the **Diet AI Agent**. You also own the **agent evaluations** for both AI agents (workout + diet) — a key course requirement.

---

## Sprint 0 — Days 1–4

- [ ] **Research LLM capabilities for nutrition**
  - Test Ollama with nutrition-related prompts
  - Experiment with system prompt engineering: what format works best for meal plans, grocery lists
  - Identify limitations (hallucinated calorie counts, etc.) — document for evals

- [ ] **Database models**
  - `DietPreference` model: id, user_id (FK), allergies (JSON array), diet_style (enum: omnivore/vegetarian/vegan/pescatarian), daily_budget (decimal), custom_restrictions (text)
  - `Prescription` model: id, user_id (FK), file_url, original_filename, notes (text), uploaded_at
  - Write Alembic migration

---

## Sprint 1

### Health Data — Backend

- [ ] **Diet preferences endpoints**
  - `GET /api/users/me/diet-preferences` — get current preferences
  - `PUT /api/users/me/diet-preferences` — update preferences
  - Body: `{ allergies: ["gluten", "lactose"], diet_style: "vegetarian", daily_budget: 50.0, custom_restrictions: "low sodium" }`

- [ ] **Prescriptions endpoints**
  - `POST /api/users/me/prescriptions` — upload file (PDF/image), multipart form
  - `GET /api/users/me/prescriptions` — list all prescriptions
  - `DELETE /api/users/me/prescriptions/{id}` — delete prescription
  - File storage: local `uploads/prescriptions/` dir (or Cloudinary if time allows)
  - Optional: basic text extraction from PDF (PyMuPDF) to include in AI context

### Health Data — Frontend

- [ ] **Diet Preferences screen**
  - Multi-select chips for allergies: gluten, lactose, nuts, shellfish, soy, eggs, custom
  - Dropdown for diet style
  - Number input for daily budget
  - Free text for additional restrictions
  - Save button → `PUT /api/users/me/diet-preferences`

- [ ] **Prescriptions screen**
  - "Upload Prescription" button → `expo-document-picker` (PDF) or `expo-image-picker` (photo)
  - List of uploaded prescriptions with filename + date
  - Tap to preview, swipe to delete

---

## Sprint 2

### Diet AI Agent — Backend

- [ ] **System prompt** for Diet Counselor
  - Role: expert nutritionist and meal planner
  - Capabilities: knows macros/micros, meal prep, grocery optimization, budget-aware cooking
  - Rules: always respect allergies (CRITICAL — never suggest allergenic foods), consider budget, support medical prescriptions
  - Format: structured meal plans and grocery lists when asked

- [ ] **Context injection**
  - Before each LLM call, fetch and inject:
    - User profile: age, weight, height, goals
    - Diet preferences: allergies, style, budget, restrictions
    - Prescription notes (extracted text, if available)
    - Last 5 messages from conversation history
  - Format as structured block in system prompt:
    ```
    USER CONTEXT:
    - Allergies: gluten, lactose
    - Diet: vegetarian
    - Budget: 50 RON/day
    - Prescription notes: "Avoid high sodium, increase potassium intake"
    - Goal: lose 5kg
    ```

- [ ] **Diet agent endpoints** (reuse M4's `Conversation` + `Message` models)
  - `POST /api/ai/diet/chat` — body: `{ message, conversation_id? }`
    - Uses M4's `LLMService` with diet-specific system prompt
    - Saves messages to shared conversation/message tables with `agent_type = "diet"`
  - `GET /api/ai/diet/conversations` — list conversations
  - `GET /api/ai/diet/conversations/{id}` — get messages

### Diet AI — Frontend Connection

- [ ] **Connect Diet chat to backend**
  - Use M2's `ChatScreen` component
  - Configure quick actions: "What should I eat today?", "Grocery list for this week", "Meal under 30 RON", "High protein snack"
  - Pass `agent_type = "diet"` to API calls

---

## Sprint 3

### Agent Evaluations (BOTH agents — course requirement)

- [ ] **Eval framework** (`backend/tests/test_agent_evals.py`)
  - Set of test prompts with expected behaviors (not exact answers)
  - Run each prompt through the agent, check response for required elements

- [ ] **Workout Agent evals** (10–15 test cases)
  - "I want chest exercises" → response mentions bench press, push-ups, or similar
  - "I'm very tired today" → response suggests lighter workout or rest
  - "Give me a 30 minute full body workout" → response has structured steps with times
  - "I'm a beginner" → response avoids advanced exercises
  - "What about legs?" (after chest conversation) → response transitions correctly

- [ ] **Diet Agent evals** (10–15 test cases)
  - "Suggest dinner" (user allergic to gluten) → response has NO gluten-containing foods
  - "Grocery list for the week" → response is a structured list with quantities
  - "I have 30 RON budget for today" → response suggests affordable meals
  - "I'm vegan" → response has NO animal products
  - "High protein meal" → response mentions protein content

- [ ] **Eval runner**
  ```python
  @pytest.mark.parametrize("prompt,must_contain,must_not_contain", EVAL_CASES)
  async def test_agent_response(prompt, must_contain, must_not_contain):
      response = await agent.chat(prompt, user_context=TEST_USER)
      for keyword in must_contain:
          assert keyword.lower() in response.lower()
      for keyword in must_not_contain:
          assert keyword.lower() not in response.lower()
  ```
  - Results logged as pass/fail report
  - Integrated into CI (can be a separate workflow since LLM tests are slow)

### Weight Tracker — Frontend (bonus)

- [ ] **Weight progress screen**
  - Input current weight (with date)
  - Chart showing weight over time (line graph)
  - Show target weight as a horizontal line
  - Use `react-native-chart-kit` or `victory-native`

---

## Key Files You Own

```
backend/app/
├── routers/diet.py
├── routers/health.py
├── services/diet_agent.py
├── models/diet.py
└── schemas/diet.py, health.py

backend/tests/
├── test_agent_evals.py        ← BOTH agents
├── test_diet_endpoints.py
└── eval_cases/
    ├── workout_evals.json
    └── diet_evals.json

frontend/src/
├── screens/
│   ├── chat/DietChatScreen.tsx  (wraps M2's ChatScreen)
│   ├── health/DietPreferencesScreen.tsx
│   ├── health/PrescriptionsScreen.tsx
│   └── health/WeightTrackerScreen.tsx
```

---

## User Stories Covered

- US-06 (diet side): Personalized diet recommendations
- US-11: Meal suggestions from AI
- US-12: Grocery list generation
- US-16: Food preferences, allergies, budget
- US-17: Upload health prescriptions

---

## Coordination with M4

| Aspect | M4 Provides | M5 Uses |
|--------|------------|---------|
| `LLMService` | Creates the class + Ollama config | Imports and calls with diet system prompt |
| `Conversation` model | Creates the DB model + migration | Reuses with `agent_type = "diet"` |
| `Message` model | Creates the DB model | Reuses for diet messages |
| Ollama setup | Ensures it runs in docker-compose | Uses same Ollama instance |

**Communication point:** Agree with M4 on `LLMService.generate()` interface before Sprint 2.

---

## Definition of Done

- [ ] Diet preferences save and load correctly
- [ ] Prescriptions upload and display
- [ ] Diet AI responds with meal suggestions respecting allergies and budget
- [ ] Grocery list generation works
- [ ] Eval suite runs: 80%+ pass rate for both agents
- [ ] Eval results visible in CI logs
- [ ] Minimum 5 commits with meaningful messages
