# Course rubric report — software development process & AI

[← Back to README](../README.md)

This document summarizes how the **FitPlus** project maps to the course requirements for development process, AI tooling, and deliverables. Where details already exist elsewhere, only **links** are repeated here.

---

## Proposed grade: software development with AI (1–10)

| Points | Criterion | Where it is covered |
|-------:|-----------|---------------------|
| **2** | User stories (min. 10) + backlog | [backlog.md](backlog.md) — stories by epic + sprint backlog; extra nutrition / AI section. |
| **1** | Diagrams (UML-style, components, workflows) | [arhitecture.md](arhitecture.md) — Mermaid diagrams (system, ER-style, API overview, agent flow, deployment). |
| **1** | Git source control (branch, merge/rebase, PR, min. 5 commits per student) | [contributing.md](contributing.md) — branch / PR / commit conventions; concrete history lives in the **GitHub repository** (Commits / Pull requests). |
| **2** | Automated tests (including agent evals) | [testing.md](testing.md) — pytest, Ruff, declarative evals (`tests/evals/`), CI. |
| **1** | Bug reporting + fix via pull request | Process: **GitHub Issues** (bug description) + **PR** that closes them (`Closes #…`). Evidence = links in the repo; no separate doc required if issues/PRs are public. |
| **1** | CI/CD pipeline | [testing.md](testing.md) — *GitHub Actions* section; workflow file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (backend: Ruff, Alembic, pytest + coverage; mobile: ESLint, Jest, TypeScript; Docker backend image build). |
| **2** | Report on AI tool usage during development | [ai_tools_report.md](ai_tools_report.md) — tool table + per-member sections; filled incrementally by the team. |

**Note:** In-app LLMs (workout/diet agents, plate vision) are integrated via **cloud APIs**. Our documented setup uses **Anthropic**; the single integration layer is `LLMService` — see `backend/app/services/llm_service.py`.

---

## 1. User stories and backlog 

**What we did:** User stories grouped by domain (gym discovery, payments, profile, workout/diet AI agents) and a **backlog** ordered by sprint, with dependencies and owners.

**Where:** [backlog.md](backlog.md)

**For graders:** The user-story table exceeds the minimum of 10; the backlog breaks them into numbered tasks tied to sprints.

---

## 2. Diagrams 

**What we did:** Architecture document with **Mermaid** diagrams (not classic UML XMI, but equivalent visuals for architecture, data, API flow, and agent sequence).

**Where:** [arhitecture.md](arhitecture.md)

**For graders:** Shows Mobile → FastAPI → PostgreSQL / Stripe / LLM API; chat message flow; deployment view.

---

## 3. Git: branches, merges, pull requests, commits 

**What we did:** Branch conventions (`feature/…`, `fix/…`), PRs into `main`, descriptive commit messages; CI runs on PRs.

**Where:** [contributing.md](contributing.md) + **GitHub** history (Commits, Pull requests, linked Issues where applicable).

**For graders:** Per-student commit counts are verified from **Contributors** / per-author history; we do not duplicate commit hashes here.

---

## 4. Automated tests and agent evals

**What we did:** API integration tests (auth, users, mocked payments, AI chat, gym smoke), **agent evals** with mocked LLM and YAML scenarios (`golden_cases.yaml`), plus lint/format and coverage in CI.

**Where:** [testing.md](testing.md)

**For graders:** Evals are **contract tests** (message persistence, `agent_type`), not subjective “LLM quality” scoring inside PR CI.

---

## 5. Bug reporting and PR-based fix

**What we did:** Bugs filed as **GitHub Issues** (reproduction steps, expected vs. actual behavior), then fixes on a **dedicated branch** and a **Pull Request** that closes the issues (`Closes #…`).

**Where:** **GitHub** only (Issues + PR); optional notes in commit/PR description.

**For graders:** The chain “report → code → review/CI → merge” is visible in GitHub’s UI.

---

## 6. CI/CD pipeline

**What we did:** GitHub Actions workflow on push/PR to `main`: backend checks (Ruff, Alembic migrations, pytest with coverage), mobile (ESLint, Jest, TypeScript), Docker backend image build.

**Where:** [testing.md](testing.md) + [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

**For graders:** No automated production deploy in this repo; focus is a **quality gate** on each PR.

---

## 7. AI tools usage report

**What we did:** Dedicated document listing AI tools used (IDE, chat, copilot, etc.), how and by whom, plus reflection on the process.

**Where:** [ai_tools_report.md](ai_tools_report.md)

**For graders:** Central table + per-member sections (to be completed with concrete prompts / manual adjustments as the project finishes).

---

## Other useful documents

| Document | Role |
|----------|------|
| [run_project_guide.md](run_project_guide.md) | How to run DB, backend, mobile |
| [task_distribution.md](task_distribution.md) | High-level task split across members |
| [tasks/](tasks/) | Per-member task sheets |

---

*Last updated: created for course submission requirements; numeric grade and detailed AI logs remain the team’s responsibility before the deadline.*

**Note:** Files under `docs/tasks/` and `task_distribution.md` may still mention **Ollama** from early planning. **Current configuration and main documentation** describe **Anthropic** (and OpenAI as an optional alternative in code).
