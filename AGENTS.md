# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Repository structure

This repo has two distinct parts:
- **`demo-app/`** — the target full-stack application (React + Express + TypeScript + Vitest). This is what agents modify.
- **`bobflow/`** — the orchestration layer (workflow spec, skill, agent role files). These are Markdown definitions; agents read them but do not modify them during feature delivery.

`AGENTS.md`, `.bobignore`, and `.gitignore` are at the repo root and must not be modified during feature delivery.

## Commands (all must be run from `demo-app/`)

```bash
cd demo-app
npm test                   # run the full test suite (vitest run, node environment)
npm run test:watch         # vitest in watch mode
npm run typecheck          # tsc --noEmit (no emit, types only)
npm run dev                # concurrently: API on :3001, React on :5173
npm run build              # vite build → dist/
```

**Run a single test file:**
```bash
cd demo-app
npx vitest run tests/user.test.ts
```

## Critical architecture facts

- `vite.config.ts` sets `root: 'frontend'` — **Vite's root is NOT the project root**. `vitest.config.ts` is kept separate on purpose: using `vite.config.ts` for vitest would hide `tests/` from the test runner.
- `backend/src/app.ts` exports `createApp()` separately from `server.ts`. Tests import `createApp()` directly (via supertest) — no port binding needed.
- The `User` interface is **duplicated**: `backend/src/services/userService.ts` (full, with `id`) and `frontend/src/api/user.ts` (partial, no `id`). Keep them in sync when adding fields.
- There is no database. User state lives in an in-memory `Record<string, User>` in `userService.ts`. State resets on each test run automatically.
- Uploaded files are stored in `demo-app/uploads/`. The served URL must be derived from the **generated** filename (uuid + validated extension), never from the client-supplied filename.

## Code style

- TypeScript strict — no `any`. Use explicit return types on exported functions.
- Named exports for everything in `routes/` and `services/`. Default exports for React components only.
- Express route handlers: assign to a `const router = Router()`, then `export default router`. Export constants (like `CURRENT_USER_ID`) as named exports from the same file.
- Tests use `vitest` imports (`describe`, `it`, `expect`) + `supertest` against `createApp()`. No mocking — assert the acceptance criteria via real HTTP calls.
- File upload security controls (from `docs/design.md`) are **required**, not optional:
  - Size ≤ 5MB, server-side
  - MIME allow-list: `image/jpeg` and `image/png` only
  - Magic-byte validation (Content-Type is attacker-controlled)
  - Generated storage name: `uuid + validated extension`
  - Path traversal rejection (`../`, absolute paths, separators)
  - Zero-byte rejection
