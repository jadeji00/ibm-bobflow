# Project Architecture Constraints (Non-Obvious Only)

- **Phase boundary is a hard constraint**: only phases 5 and 7 may modify code (`bobflow/workflow.md` invariant 1). Plans produced in phases 1–4 must not touch files.
- Three specialist subagents (architecture, security, testing) run in parallel in phase 3 with no shared state. Conflicts between their outputs must be resolved explicitly in the synthesis — never silently averaged.
- Every security control in `docs/design.md` is **required** for the avatar-upload feature. Missing any one of them is a blocking issue in phase 8 review.
- The Express app and Vite dev server are separate processes (`app.ts` vs `server.ts`). Any new API route goes in `backend/src/routes/`, registered via `app.ts` — never wired in `server.ts`.
- `uploads/` is the only storage target for files. Paths must be constructed server-side from a generated UUID + validated extension, never from client input.
- The test suite is HTTP-level (supertest against `createApp()`). New tests follow the same pattern — no unit-mocking the layer under test.
