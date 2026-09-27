# BobFlow

**An evidence-driven developer workflow orchestrator powered by IBM Bob 2.0.**

> From "AI that writes code" to "AI that orchestrates software development."

IBM Bob 2.0 Hackathon · September 25–27, 2026

---

## What is BobFlow?

BobFlow models feature delivery as a **coordinated, multi-stage workflow** rather
than a single prompt-to-code interaction:

```
Feature Request → Understand → Plan → Parallel Investigation
      → Synthesize → Implement → Verify → Fix/Retest → Review → Delivery
```

The parallel investigation stage runs three independent, **read-only**
specialist agents — **Architecture**, **Security**, and **Testing** — whose
findings are reconciled before a single line of code is written.

> **On execution:** BobFlow specifies these three investigations as independent.
> In this build they were run as three **separate sequential IBM Bob tasks**,
> not as concurrent subagents. The workflow is runtime-agnostic — what it
> requires is that each specialist has a distinct mandate and cannot edit code,
> not that they overlap in wall-clock time.

See [`bobflow/workflow.md`](bobflow/workflow.md) for the full stage table.

## What is the demo?

A small, real full-stack application that works but **cannot upload avatars**.
The single feature request — adding validated avatar upload — is delivered
end-to-end by IBM Bob through the BobFlow workflow.

The demo app is the **target codebase**. Bob is the **engine**.

## What is IBM Bob doing?

| Bob capability | Where it is used |
|---|---|
| **Agent mode** | Phases 5 and 7 — the only phases that edit code |
| **Plan mode** | Phases 1–2 — understanding and planning, no edits |
| **Skills** | `bobflow/skills/feature-delivery/SKILL.md` |
| **Specialist investigation tasks** | Phase 3 — Architecture / Security / Testing agents, each run as its own read-only task |
| **Project context** | `AGENTS.md` |
| **Command execution** | Phase 6 — `npm test` is executed, not simulated |
| **Verification** | Phases 6–7 — real test output drives the fix loop |

> **REQUIRES IBM BOB CONFIGURATION** — the agent and skill definitions in
> `bobflow/` are written as Markdown specifications. Bob's current skill
> discovery path and subagent registration mechanism must be confirmed against
> the installed version. See [`docs/design.md`](docs/design.md).

## Repository layout

```
.
├── demo-app/          # the target codebase (React + Express + Vitest)
├── bobflow/           # Bob configuration: workflow, skill, agents
│   ├── workflow.md
│   ├── skills/feature-delivery/SKILL.md
│   └── agents/{architecture,security,testing}-agent.md
├── docs/              # feature request, design notes, demo script
├── bob_sessions/      # REQUIRED — Bob task session summary screenshots
├── AGENTS.md          # project rules for Bob
├── .bobignore         # from IBM template — do not modify
├── .gitignore         # from IBM template — do not modify
└── SECURITY.MD
```

## Run the demo app

```bash
cd demo-app
npm install
npm run dev          # API on :3001, web on :5173
```

Open <http://localhost:5173>.

## Run the tests

```bash
cd demo-app
npm test
```

## Where things live

| | |
|---|---|
| BobFlow workflow | [`bobflow/workflow.md`](bobflow/workflow.md) |
| BobFlow skill | [`bobflow/skills/feature-delivery/SKILL.md`](bobflow/skills/feature-delivery/SKILL.md) |
| Architecture Agent | [`bobflow/agents/architecture-agent.md`](bobflow/agents/architecture-agent.md) |
| Security Agent | [`bobflow/agents/security-agent.md`](bobflow/agents/security-agent.md) |
| Testing Agent | [`bobflow/agents/testing-agent.md`](bobflow/agents/testing-agent.md) |
| Feature request | [`docs/feature-request.md`](docs/feature-request.md) |
| Demo script | [`docs/demo-script.md`](docs/demo-script.md) |
| Bob evidence | [`bob_sessions/`](bob_sessions/) |

## License

MIT — see [LICENSE](LICENSE).

## Security

See [SECURITY.MD](SECURITY.MD). Never commit credentials.
