# demo-app

The target codebase for the BobFlow demo. A small user-profile application that
**works**, but has **no avatar upload**.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript (run via `tsx`) |
| Testing | Vitest + Supertest |
| Storage | Local `uploads/` directory — no database, no cloud |

## Current behaviour

`GET /api/user` returns the single seeded profile:

```json
{ "username": "Alice", "email": "alice@example.com", "avatarUrl": null }
```

The profile page renders a "No Avatar" placeholder.

There is **no upload endpoint, no upload UI, and no file validation** — that is
the feature the demo delivers.

## Commands

```bash
npm install
npm run dev        # API :3001 + web :5173 (concurrently)
npm run dev:api    # API only
npm run dev:web    # web only
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run build      # vite build → dist/
```

## Layout

```
demo-app/
├── frontend/            Vite root
│   ├── index.html
│   └── src/
│       ├── api/user.ts
│       └── pages/Profile.tsx
├── backend/src/
│   ├── app.ts           Express app factory (exported for tests)
│   ├── server.ts        listen()
│   ├── routes/user.ts
│   └── services/userService.ts
├── tests/               Vitest + Supertest
└── uploads/             Local file storage (empty)
```

`backend/src/app.ts` is split from `server.ts` so tests can mount the app with
Supertest without binding a port.
