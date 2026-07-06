# Contributing

Version: 1.0

## Before You Start

Read these documents in order:

1. docs/architecture/DOMAIN_MODEL.md
2. docs/architecture/PRINCIPLES.md
3. docs/architecture/ADR.md

If your implementation conflicts with them, stop and update the architecture before writing code.

---

## Development Workflow

1. Create a feature branch.
2. Implement the feature.
3. Add or update tests.
4. Update documentation if needed.
5. Run:
   - npm run build
   - npm test
   - lint
6. Open a Pull Request.

---

## Coding Standards

- Keep business logic separate from UI.
- Prefer pure functions.
- Avoid duplicate logic.
- No TODOs in production code.
- No dead code.
- Keep components focused.
- Prefer composition over inheritance.

---

## Architecture Rules

- Respect group isolation.
- Generator must remain pure.
- Runtime must not rewrite history.
- Reports use Finished matches only.

---

## Pull Request Checklist

- Build passes
- Tests pass
- Documentation updated
- No architectural violations
