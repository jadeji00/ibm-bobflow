# Project Documentation Context (Non-Obvious Only)

- `bobflow/` is documentation/configuration for the orchestration workflow — it is NOT application source code. Do not look there for React or Express implementation details.
- `docs/design.md` is the authoritative reference for security controls and the test matrix. It is more detailed and up-to-date than the agent role files.
- `demo-app/vite.config.ts` and `demo-app/vitest.config.ts` are intentionally separate — this is by design (see comment in `vitest.config.ts`), not a mistake.
- The demo app has no database by design. Persistence questions should be directed at the in-memory store in `demo-app/backend/src/services/userService.ts`.
- `bob_sessions/` contains screenshot evidence from IBM Bob task sessions — not application code or test results.
