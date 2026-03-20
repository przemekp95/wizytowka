# Contributing

## Delivery Defaults

This repository now treats TDD, DDD, and BDD as working defaults rather than
optional slogans.

## TDD

- For behavior changes and bug fixes, prefer red-green-refactor.
- Start with the smallest failing unit, integration, or behavior test that
  proves the requirement.
- If you intentionally skip test-first for a task, explain why in the PR or
  change summary.

## DDD

- Preserve bounded contexts and domain language.
- Backend flows should keep domain, application, and infrastructure concerns
  separate when the slice has real business behavior.
- The contact, chat, and portfolio flows are the reference bounded contexts in this repo:
  `domain` objects, application services, ports, and adapters.

## BDD

- User-visible backend behavior belongs in executable scenarios.
- Gherkin features live in `backend/features/**/*.feature`.
- Step definitions live in `backend/features/step-definitions/**/*.ts`.
- Run them with `corepack pnpm -F backend test:bdd`.
- Contact and chat are the baseline examples; new user-visible backend flows
  should extend that coverage pattern.

## Required Checks

Run the smallest relevant subset before opening a PR, and run the full repo
gate before merge when the change crosses multiple surfaces.

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm -F backend test:e2e
corepack pnpm build
```

## Pull Requests

- Keep changes scoped and explain public contract changes.
- Update docs when setup, architecture, or behavior changed.
- If you changed user-visible behavior, update or add the matching BDD
  scenario.
