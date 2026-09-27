# Design Notes

Consolidated architecture, security, and testing notes for BobFlow. The
authoritative workflow is [`bobflow/workflow.md`](../bobflow/workflow.md).

## Architecture

```
                    IBM Bob
                       │
                       ▼
               Feature Delivery
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
       Architecture Security  Testing
          Agent       Agent      Agent
            └──────────┼──────────┘
                       ▼
                   Synthesis
                       │
                       ▼
                  Implementation
                       │
                       ▼
                     Tests
                       │
                 ┌─────┴─────┐
                 ▼           ▼
               Pass         Fail
                 │           │
                 │        Fix/Retest
                 │           │
                 └─────┬─────┘
                       ▼
                    Review
                       │
                       ▼
                    Delivery
```

> **IBM Bob is the execution environment and orchestration layer.
> The demo application is only the target codebase.**

### Demo app request flow

```
React frontend  →  Express API  →  Service layer  →  Local storage (uploads/)
```

---

## Security

The feature is a **file upload**, so the trust boundary is the whole point. The
client is hostile by default.

| Control | Requirement | Rationale |
|---|---|---|
| Size limit | ≤ 5MB, enforced server-side | `Content-Length` is client-supplied and can lie |
| Type allow-list | `image/jpeg`, `image/png` only | Anything else is rejected outright |
| MIME is not proof | Magic bytes / content sniffing | `Content-Type` is attacker-controlled |
| Extension is not proof | A `.png` suffix proves nothing | Spoofed-extension uploads are the classic bypass |
| Generated storage name | `uuid + validated extension` | The client filename must never reach the filesystem |
| Path traversal | Reject `../`, absolute paths, separators | Otherwise the upload escapes `uploads/` |
| Empty file | Reject zero bytes | A zero-byte "image" is not an image |
| Client validation | Convenience only | `accept="image/*"` and `file.type` are UX, not security |

Stored files are **never executed or served as-is** from a path the user
supplied; the served URL is derived from the generated name.

---

## Testing

Framework: **Vitest**, with **Supertest** for HTTP-level assertions against the
Express app instance. `backend/src/app.ts` is exported separately from
`server.ts` precisely so tests can mount the app without binding a port.

### Matrix

| Class | Case | Expected |
|---|---|---|
| positive | JPEG ≤ 5MB | accepted |
| positive | PNG ≤ 5MB | accepted |
| negative | JPEG > 5MB | rejected |
| negative | PNG > 5MB | rejected |
| negative | TXT | rejected |
| negative | PDF | rejected |
| negative | empty file | rejected |
| negative | MIME not in allow-list | rejected |
| security | path traversal in filename | rejected |
| security | spoofed extension | rejected |
| regression | `GET /api/user` unchanged | passes |

### Principle

Assert the **acceptance criteria**, not implementation details. A test that
breaks when a function is renamed but the behaviour is identical is not testing
the requirement.

---

## Open items — REQUIRES IBM BOB CONFIGURATION

These are deliberately **not** guessed. Confirm against the installed Bob build:

1. **Skill discovery path.** `bobflow/skills/feature-delivery/SKILL.md` uses the
   common `SKILL.md` + YAML front-matter convention. Bob's actual required path
   and fields are unverified.
2. **Subagent registration.** `bobflow/agents/*.md` are Markdown role
   specifications. How Bob registers a custom agent or custom mode — and its
   required file format — is unverified.
3. **Parallel execution.** Whether the installed Bob version runs subagents
   concurrently. If not, run them sequentially and say so in the demo.
4. **`AGENTS.md` generation.** Bob's `/init` is expected to generate or augment
   `AGENTS.md`. Confirm it is picked up as project context.
