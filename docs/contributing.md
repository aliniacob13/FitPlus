# Contributing & Git Workflow

[← Back to README](../README.md)

---

## Branch Strategy

```
main            ← production-ready, deploy triggers here
  └── develop   ← integration branch, all features merge here
        ├── feature/auth-jwt           (Membru 1)
        ├── feature/rn-navigation      (Membru 2)
        ├── feature/gym-nearby-api     (Membru 3)
        ├── feature/stripe-checkout    (Membru 4)
        ├── feature/diet-agent         (Membru 5)
        └── bugfix/map-pin-crash       (any member)
```

### Rules
- **Never push directly to `main` or `develop`** — always use Pull Requests
- Create branches from `develop`: `git checkout -b feature/my-feature develop`
- Branch naming: `feature/short-description`, `bugfix/short-description`, `hotfix/short-description`
- Keep branches small and focused — one feature per branch

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add gym nearby endpoint with PostGIS
fix: resolve JWT expiration issue on refresh
docs: update API endpoint documentation
test: add unit tests for workout agent
style: format code with ruff
refactor: extract LLMService into separate module
chore: update dependencies
```

**Minimum 5 commits per team member** (course requirement).

---

## Pull Request Process

1. Push your branch and open a PR against `develop`
2. Fill in the PR template (description, related user story, screenshots if UI)
3. Request review from at least 1 team member
4. CI must pass (lint + tests) before merge
5. Reviewer approves → author merges (squash merge preferred)
6. Delete the branch after merge

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Related User Story
Closes #US-XX

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Checklist
- [ ] Code follows project structure
- [ ] Tests added/updated
- [ ] No lint errors
- [ ] Manually tested
- [ ] Screenshots attached (if UI change)
```

---

## Bug Reporting (course requirement)

When you find a bug in another member's module:

1. Open a **GitHub Issue** with:
   - Title: `[BUG] Short description`
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots / logs
   - Label: `bug` + module label (`gym`, `payments`, `ai-workout`, etc.)
2. The module owner creates a `bugfix/` branch, fixes, and opens a PR
3. The bug reporter reviews the fix PR

---

## Code Review Guidelines

- Be constructive and specific
- Check for: logic errors, missing error handling, security issues, code duplication
- Approve only if CI passes and code is clean
- Use GitHub's "Request changes" feature when needed
