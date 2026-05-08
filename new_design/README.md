# Handoff: FitPlus Redesign (Mobile + Web)

## Overview

FitPlus is a wellness/fitness app combining nutrition tracking (food diary, AI Plate Coach, calorie & macro goals), workout planning, gym discovery (map), and an AI coach. This handoff is a **complete UI redesign** of every primary surface — including a new auth & onboarding flow — across **mobile (iOS-first)** and **web (desktop, ≥1180 px)**.

The visual direction is **"Wellness Organic" — Apple-like premium**: warm cream backgrounds, deep forest green primary, terracotta accent, and serif/italic typography for emotional accent. The same screens are also designed in three additional palettes (Terracotta, Indigo, **Lime · Dark** — the originally-shipping palette) which the user can switch between.

## About the design files

The files in this bundle are **design references created in HTML/JSX** — interactive prototypes that show intended look, layout, copy and behavior. They are **NOT production code to ship**. The job is to **recreate these designs in your existing app codebase** (likely React Native / SwiftUI / Kotlin for mobile; React / Next.js for web) using your established components, navigation, state management, and theming systems.

Where this handoff is opinionated: typography, spacing, color tokens, component anatomy, and copy are **final**. Animation timings and micro-interactions are guidance, not contracts.

## Fidelity

**Hi-fi.** All screens are pixel-level mockups with final colors, type scale, spacing, copy (English UI / Romanian content), and component anatomy. Implement them faithfully.

## Files in this bundle

| File | Purpose |
|---|---|
| `FitPlus Redesign.html` | Entry point — open in any modern browser to see the live prototype canvas |
| `styles.css` | **All design tokens** for the four palettes — read this first |
| `components.jsx` | Shared primitives: `Icon` (named SVG icons), `Ring` (progress ring), `Bar`, `Avatar`, etc. |
| `mobile.jsx` | All mobile screens (`M.Home`, `M.Diary`, `M.Plate`, `M.Chat`, `M.Workout`, `M.Map`, `M.Profile`, `M.TabBar`) |
| `web.jsx` | All web screens (`W.Dash`, `W.Diary`, `W.Chat`, `W.Map`) and `WebShell` (sidebar) |
| `auth.jsx` | Auth & onboarding for both platforms (`A.MWelcome/MLogin/MRegister/MOnboard`, `A.WLogin/WRegister/WOnboard`) |
| `app.jsx` | Composition / canvas wiring + interactive prototype + Tweaks panel |
| `design-canvas.jsx`, `ios-frame.jsx`, `browser-window.jsx`, `tweaks-panel.jsx` | Presentation chrome only — **do not port**; they're for the design canvas |

## Design tokens

All tokens live in `styles.css` as CSS custom properties scoped by `[data-palette="..."]` on `<html>`. Default palette is **`lime`** (dark theme). The same variable names exist in all four palettes — switch palettes by changing the attribute.

### Forest (Wellness Organic — primary direction)

| Token | Value |
|---|---|
| `--bg` | `#faf6ee` (warm cream) |
| `--bg-deep` | `#f3ecd9` |
| `--surface` | `#ffffff` |
| `--surface-2` | `#f6efde` |
| `--surface-3` | `#ece2c7` |
| `--ink` | `#1a221d` |
| `--ink-2` | `#2f352f` |
| `--muted` | `#6e6f64` |
| `--muted-2` | `#a09f93` |
| `--line` | `#e3dac0` |
| `--line-soft` | `#efe7d0` |
| `--primary` | `#2d4a3e` (forest green) |
| `--primary-ink` | `#f7f3e9` |
| `--primary-soft` | `#e0e7dd` |
| `--accent` | `#d97757` (terracotta) |
| `--accent-soft` | `#f3dccd` |
| `--good` / `--warn` / `--bad` | `#5a8d6f` / `#c98b3a` / `#b85d4a` |
| `--macro-protein` / `carbs` / `fat` | `#2d4a3e` / `#d97757` / `#c98b3a` |

### Lime · Dark (default / originally-shipping palette)

| Token | Value |
|---|---|
| `--bg` / `--bg-deep` | `#0d0d0d` / `#050505` |
| `--surface` / `2` / `3` | `#161616` / `#1f1f1f` / `#2a2a2a` |
| `--ink` / `--ink-2` | `#f2f2f2` / `#e5e5e5` |
| `--muted` / `--muted-2` | `#9a9a9a` / `#6a6a6a` |
| `--line` / `--line-soft` | `#2e2e2e` / `#1f1f1f` |
| `--primary` / `--primary-ink` | `#c5f135` (lime) / `#0d0d0d` |
| `--accent` | `#c5f135` |

(Terracotta and Indigo palettes also defined — see `styles.css`. **Build palette switching as a real theme system**, not a fork per palette.)

### Typography

- **Body / UI**: `Geist` (Google Fonts), weights 400/500/600/700.
- **Display / accent**: `Instrument Serif` — used for hero numbers, screen titles, and italic emphasis ("smart.", "obiectivul").
- **Mono / eyebrow**: `JetBrains Mono` — used for `.eyebrow` labels: 10px, uppercase, letter-spacing 0.18em, color `--muted`.

Type scale (mobile):
- Hero serif: 46px / line-height 1.02 / letter-spacing -0.025em
- Screen title: 30–36px serif, letter-spacing -0.02em
- Section title: 18–22px Geist 600
- Body: 13–14px / line-height 1.5–1.6
- Eyebrow: 10px mono / letter-spacing 0.18em / uppercase

### Spacing & radii

- Card radius: **22px** (large surfaces), **14px** (inputs/inner cards), **12–14px** (icon tiles), **999px** (pills/buttons).
- Card padding: 16–20px mobile, 20–28px web.
- Stack gap between sections: 18–24px mobile.
- CTA button: 12–16px vertical pad, 18–22px horizontal, font 14–15px, weight 600, gap 8px between label & icon, radius 999px.

### Iconography

All icons live in `components.jsx` as a single `<Icon name="..." size={n} color="..." stroke={1.5}/>` switch. Stroke-only, 24×24 viewBox, `strokeLinecap="round"`. Names used: `home, bowl, spark, pin, user, plus, arrow, arrow-up, left, right, flame, dumbbell, leaf, camera, mic, send, search, heart, check, bell, gear, chart, play, pause, close, menu, star, water, key`. **Use your existing icon library** (Lucide, SF Symbols, Material) — match shapes, not paths.

## Screens / views

### Mobile

| # | Screen | File / export | Purpose |
|---|---|---|---|
| 00 | Welcome | `A.MWelcome` | Splash + brand + 2 CTAs (Începe gratuit / Am deja cont) |
| 01 | Sign in | `A.MLogin` | Email + password + social (Apple/Google/FB) |
| 02 | Create account | `A.MRegister` | Name + email + password (with strength meter) |
| 03 | Onboarding | `A.MOnboard` | 4-step wizard: Goal → Stats → Diet preferences → Level. Final step shows calculated daily plan (kcal / protein / training freq) |
| 04 | Home | `M.Home` | Hero kcal ring + macro tri-ring, streak, today's meals, quick-actions |
| 05 | Food Diary | `M.Diary` | Meal-by-meal list (Mic dejun / Prânz / Cină / Snack) with kcal + macros |
| 06 | Plate Coach | `M.Plate` | Camera/photo input + AI annotations on the plate (protein/carbs/fat callouts) |
| 07 | AI Coach | `M.Chat` | Chat thread with the AI (workout & diet advice), suggestion chips |
| 08 | Workout | `M.Workout` | Today's plan: warm-up + exercise cards (sets × reps, RPE), rest timer |
| 09 | Gym Map | `M.Map` | Faux map with pinned gyms, bottom sheet with cards (rating, distance, price) |
| 10 | Profile | `M.Profile` | Avatar, weight tracker chart, goal, settings list |

Mobile frame size: **392 × 812** (iOS spec). Tab bar visible on Home/Diary/Chat/Map/Profile; hidden on Plate/Workout/Auth/Onboarding.

### Web (desktop)

| # | Screen | File / export | Purpose |
|---|---|---|---|
| 01 | Sign in | `A.WLogin` | Split: brand panel (480px, marketing + stat tiles) + form panel |
| 02 | Create account | `A.WRegister` | Same split layout |
| 03 | Onboarding | `A.WOnboard` | Centered 720px-wide card, 2-column goal selector |
| 04 | Dashboard | `W.Dash` | Sidebar nav + main content (rings, macros, today, recent meals) |
| 05 | Food Diary | `W.Diary` | Sidebar + day list with meal sections |
| 06 | AI Coach | `W.Chat` | Sidebar + chat surface |
| 07 | Gym Map | `W.Map` | Sidebar + map + side list of gyms |

Web frame: **1180 × 760** content area. Sidebar: ~240px, fixed; main: scrollable.

## Interactions & behavior

### Navigation flow

```
Welcome ──> Sign in ──┐
   │                  │
   └──> Register ──> Onboarding (4 steps) ──> App (Home)

App tab bar: Home / Diary / Chat / Map / Profile
Home cards link: kcal ring → Diary, macro card → Diary, "Plate Coach" CTA → Plate, workout card → Workout
Diary "+" → Add food modal (out of scope — placeholder)
Plate scan button → camera flow (placeholder)
```

### Onboarding multi-step state

State shape:
```ts
{
  goal: 'lose' | 'maintain' | 'gain' | 'health',
  sex: 'male' | 'female' | 'other',
  age: number,         // 13–80
  heightCm: number,    // 120–230
  weightKg: number,    // 30–200
  diet: Set<'vegetarian'|'vegan'|'gluten-free'|'lactose-free'|'low-sugar'|'keto'|'high-protein'|'mediterranean'>,
  level: 'beginner' | 'intermediate' | 'advanced'
}
```
At step 4, calculate kcal target via Mifflin–St Jeor + activity factor + goal adjustment (-15% lose / 0% maintain / +10% gain). Protein default: 1.6 g/kg lean. Show this preview on step 4 before "Hai să începem".

### Auth

- Login: validate email format + min 8 chars password client-side, then submit.
- Register: same + password strength meter (4 segments, color shifts at level 3 to `--good`).
- Social buttons are visual only — wire to your existing OAuth providers.
- "Ține-mă conectat" persists session 30 days.

### Animations

- Screen transitions: `fp-fade-up` keyframe — 240ms ease, 6px translateY + opacity 0→1 (see `styles.css`).
- Progress dots fill in sequentially as user advances onboarding.
- Calorie ring animates from 0 → current value on mount, 800ms ease-out.
- Tab bar: active item color shifts to `--primary`, no slide indicator.
- Buttons: no hover scale; only background lighten ~6% on hover (web).

### Form validation

- Email: standard RFC pattern; show inline error below field on blur.
- Password: ≥8 chars, ≥1 number, ≥1 letter. Strength meter: 0=empty, 1=<8 chars, 2=8+ basic, 3=8+ with number, 4=12+ with number+symbol.
- Required fields: name, email, password on register; email + password on login.

### Responsive

- Mobile screens are the source of truth for ≤640px. Use the iOS layouts as-is.
- Web screens are designed for ≥1180px. Below that: collapse sidebar to icons-only at <1024px, hide entirely with hamburger at <768px, fall back to mobile layout at <640px.

## Copy

**UI labels: English. Content (food names, gym names, AI messages, examples): Romanian.** Examples to keep as-is in the recreated app:

- Welcome hero: "Mănâncă bine. Antrenează-te smart." (with "smart." italicized in `--primary`)
- Login title: "Bine ai revenit." ("revenit." italic primary)
- Register title: "Hai să-ți facem un cont." ("cont." italic primary)
- Onboarding step 1: "Care e obiectivul tău?"
- Tab labels: Home / Diary / Chat / Map / Profile (English)
- Goal options: Slăbesc / Mențin / Cresc masă / Sănătate
- Diet tags: vegetarian, vegan, gluten-free, lactose-free, low-sugar, keto, high-protein, mediterranean

## State management notes

- Theme/palette: store in user prefs, set `data-palette` on root.
- Auth: standard token + refresh, biometric unlock optional on mobile.
- Food diary: optimistic add; sync queue if offline.
- AI Plate Coach: upload photo → server returns annotated regions `{x, y, label, kcal, macros}` → render as floating callouts on top of the photo.
- Streak: client computes from `lastLoggedDates: Date[]`, shown as flame badge.

## Implementation order (suggested)

1. **Theme system** — port the four palettes as your design tokens; ship Forest + Lime · Dark first.
2. **Component primitives** — Button, Card, Field, Eyebrow, Icon, Ring (SVG progress), Bar, Pill/Chip, Avatar, Segmented control, Tab bar.
3. **Auth & Onboarding** (mobile-first) — biggest UX win, isolates from existing app surface.
4. **Home + Diary + Plate Coach** (the core nutrition loop).
5. **Workout, Map, Profile, AI Chat.**
6. **Web shell + dashboard parity.**

## Suggested prompt to give Claude Code

> I'm sending you a folder `design_handoff_fitplus/` with HTML/JSX **design references** for a complete UI redesign of FitPlus (a wellness/nutrition/fitness app — mobile + web). These are mockups, not production code.
>
> Read `README.md` first, then `styles.css` (all design tokens), then the per-platform JSX files (`mobile.jsx`, `web.jsx`, `auth.jsx`).
>
> Your task: implement this redesign in **<your stack — e.g. React Native + Expo for mobile, Next.js 14 + Tailwind for web>**, using our existing components & navigation where they exist. Match colors, type, spacing, copy, and component anatomy faithfully.
>
> Start by:
> 1. Setting up the four-palette theme system (Forest, Terracotta, Indigo, Lime · Dark) as design tokens. Default to **Lime · Dark**.
> 2. Building the shared primitives (Button, Card, Field, Icon, Ring, Bar, Eyebrow, Segmented, TabBar).
> 3. Implementing the **Auth & Onboarding flow** end-to-end (Welcome → Login/Register → 4-step Onboarding → Home).
>
> Then work through the screen list in the README in this order: Home → Diary → Plate Coach → Workout → AI Chat → Map → Profile (mobile), then web parity.
>
> Don't port the design canvas, iOS frame, browser frame, or tweaks panel — those are presentation chrome for the mockup. Use real navigation in the target stack.
>
> When you have questions about behavior not specified, ask before guessing.

## Open questions for the developer

- Backend contract for Plate Coach annotations — exact response shape?
- Are existing OAuth providers (Apple/Google/FB) already wired in the app? If yes, use those; if no, scope separately.
- Push notification copy & timing for streak reminders — owned by who?
- Is "weight tracker chart" sourced from connected scale (HealthKit/Health Connect) or manual entry only?

## Notes

- All sample data shown in the mockups (food names, gym names, weight numbers, AI messages) is illustrative — replace with real fixtures or empty states as appropriate.
- The `Tweaks` panel in the prototype is for the designer's review only; do not ship.
- The `data-palette="lime"` attribute on `<html>` in `FitPlus Redesign.html` shows the default palette only.
