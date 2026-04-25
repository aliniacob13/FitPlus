# Member 2 — Frontend Core, UI Shared & Chat Component

[← Task Distribution](../task_distribution.md) · [← README](../../README.md)

---

## Role

You build the mobile app shell and every shared component the team reuses. You're the **frontend equivalent of M1** — deliver the skeleton early so M3, M4, M5 can build their screens on top.

---

## Sprint 0 — Days 1–4 (PRIORITY)

- [ ] **React Native + TypeScript project**
  - Init with Expo: `npx create-expo-app fitplus --template expo-template-blank-typescript`
  - Folder structure: `src/screens/`, `src/components/`, `src/navigation/`, `src/hooks/`, `src/services/`, `src/store/`, `src/types/`
  - Configure path aliases (`@/components`, `@/screens`, etc.)

- [ ] **Navigation setup** (React Navigation)
  - Bottom Tab Bar with 5 tabs: Home, Map, Workout AI, Diet AI, Profile
  - Stack Navigator inside each tab
  - Auth flow: if no token → show Login/Register stack; otherwise → main tabs
  - Type-safe navigation (typed `RootStackParamList`)

- [ ] **State management** (Zustand)
  - `authStore`: token, isAuthenticated, login(), logout()
  - `userStore`: profile data, updateProfile()
  - Persist JWT in `expo-secure-store`

---

## Sprint 1

- [ ] **Auth screens**
  - Login screen: email + password inputs, "Login" button, link to Register
  - Register screen: email + password + confirm password, "Sign Up" button
  - Connect to M1's `POST /api/auth/login` and `/register`
  - Error handling (wrong credentials, network error)
  - Auto-redirect after successful login

- [ ] **Profile screens**
  - View Profile: display name, age, weight, height, goals, fitness level
  - Edit Profile: form with all fields, save button → `PUT /api/users/me`
  - Goals screen: weight target, restrictions → `PUT /api/users/me/goals`

- [ ] **API service layer**
  - `src/services/api.ts`: Axios instance with base URL from env
  - JWT interceptor: attach token to every request
  - Auto-refresh on 401: call `/api/auth/refresh`, retry original request
  - Generic helpers: `apiGet<T>()`, `apiPost<T>()`, `apiPut<T>()`

- [ ] **Shared UI component library** (`src/components/ui/`)
  - `Button` — primary, secondary, outline, disabled states
  - `Input` — text, password, with label and error message
  - `Card` — container with shadow and rounded corners
  - `Modal` — bottom sheet modal
  - `LoadingSpinner` — centered spinner
  - `ErrorState` — error message with retry button
  - `EmptyState` — illustration + message
  - Theme constants: colors, fonts, spacing (`src/theme.ts`)

---

## Sprint 2

- [ ] **Chat UI component** (reusable for both AI agents)
  - `src/components/chat/ChatScreen.tsx`:
    - Message list with bubbles (user = right/blue, AI = left/gray)
    - Auto-scroll to bottom on new message
    - Text input + Send button (fixed at bottom)
    - Loading indicator ("..." animated dots) while AI responds
  - `src/components/chat/QuickActions.tsx`:
    - Row of tappable chips above the input (e.g., "Chest exercises", "30 min workout")
    - Actions are configurable per agent (passed as props)
  - `src/components/chat/ConversationList.tsx`:
    - List of past conversations with date and preview
    - Tap to continue a conversation
  - Connect to: `POST /api/ai/{agent}/chat`, `GET /api/ai/{agent}/conversations`

- [ ] **Home screen**
  - Dashboard with summary cards: active subscription, last workout summary, meal suggestion
  - Quick action buttons: "Start Workout", "Plan Meal", "Find Gym"
  - Pulls data from multiple stores

---

## Sprint 3

- [ ] **Polish**
  - Consistent spacing and typography across all screens
  - Error handling on every screen (network errors, empty states)
  - Dark mode support (optional but impressive)
  - Smooth transitions and animations
  - Splash screen and app icon

- [ ] **Frontend tests** (Jest + React Testing Library)
  - Test shared components render correctly
  - Test auth flow (mock API calls)
  - Test chat component message display

---

## Key Files You Own

```
frontend/
├── App.tsx
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── MainTabs.tsx
│   │   └── types.ts
│   ├── screens/
│   │   ├── auth/LoginScreen.tsx
│   │   ├── auth/RegisterScreen.tsx
│   │   ├── home/HomeScreen.tsx
│   │   └── profile/ProfileScreen.tsx
│   ├── components/
│   │   ├── ui/Button.tsx, Input.tsx, Card.tsx, Modal.tsx...
│   │   └── chat/ChatScreen.tsx, QuickActions.tsx, ConversationList.tsx
│   ├── store/authStore.ts, userStore.ts
│   ├── services/api.ts
│   ├── hooks/
│   └── theme.ts
├── package.json
└── tsconfig.json
```

---

## User Stories Covered

- US-05 (UI side): Profile creation and editing
- US-10 (UI side): Weight goals and restrictions display/edit
- Chat UI supports: US-07, US-08, US-11 (visual layer)

---

## Definition of Done

- [ ] App starts with `npx expo start`, no TypeScript errors
- [ ] Navigation between all 5 tabs works
- [ ] Login → Register → Login flow works end-to-end
- [ ] Chat component displays messages and sends to backend
- [ ] All shared components are documented (props, usage)
- [ ] Minimum 5 commits with meaningful messages
