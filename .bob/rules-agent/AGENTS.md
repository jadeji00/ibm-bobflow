# Project Coding Rules (Non-Obvious Only)

- **All code changes go in `demo-app/`**. `bobflow/` is read-only during feature delivery (phases 1–4 and 6, 8, 9 are read-only per `bobflow/workflow.md`).
- Tests live in `demo-app/tests/` (top-level, NOT inside `backend/` or `frontend/`). Vitest is configured to look there via `vitest.config.ts`; the path is intentional — `vite.config.ts` would hide it.
- Import `createApp` from `../backend/src/app` in tests — never import from `server.ts` (which binds a port).
- `CURRENT_USER_ID = 'user-1'` is exported from `demo-app/backend/src/routes/user.ts` and must be used in tests that need a known user ID.
- The `User` interface exists in two places with different shapes; keep them in sync or the frontend will silently receive extra fields it does not type-check.
- File upload validation must happen **server-side only**; client-side MIME/size checks are UX conveniences and must not be relied on for security.
- Run `npm run typecheck` from `demo-app/` after every backend change — there is no build step for the backend in CI.
