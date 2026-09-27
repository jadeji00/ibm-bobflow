# BobFlow — Workflow Definition

> BobFlow treats feature delivery as a **coordinated, evidence-driven workflow**
> rather than a single prompt-to-code interaction.

```
Feature Request
        ↓
   Understand
        ↓
      Plan
        ↓
Parallel Investigation
   ├── Architecture Agent
   ├── Security Agent
   └── Testing Agent
        ↓
   Synthesize
        ↓
   Implement
        ↓
     Verify
        ↓
    Failure?
   ┌────┴────┐
  YES       NO
   │         │
Analyze      │
   ↓         │
  Fix        │
   ↓         │
Retest ──────┘
        ↓
     Review
        ↓
    Delivery
```

## Stages

| # | Stage | Input | Output | May edit code? |
|---|---|---|---|---|
| 1 | **Understand** | Feature Request + repo | Feature understanding, relevant files, architecture context, potential impact, unknowns | No |
| 2 | **Plan** | Understanding | Implementation plan, files to change/create, dependencies, testing strategy, security considerations | No |
| 3 | **Parallel Investigation** | Plan | Three independent findings reports (architecture / security / testing) | No |
| 4 | **Synthesize** | Three findings | One consolidated plan with conflicts resolved explicitly | No |
| 5 | **Implement** | Synthesized plan | Code changes across frontend, backend, validation, services, tests | **Yes** |
| 6 | **Verify** | Implemented code | Actual `npm test` output — not a prediction | No |
| 7 | **Fix / Retest** | Failing test output | Root cause, fix, re-run until green or explicitly recorded as unresolved | **Yes** |
| 8 | **Review** | Green tests + diff | Check against requirement, architecture, security, testing, project rules, code quality | No |
| 9 | **Delivery** | Review | Delivery report with evidence | No |

## Roles

| Role | Responsibility | Constraint |
|---|---|---|
| **Main Agent** | Orchestrates the workflow, owns the final decision | Only role that edits code |
| **Architecture Agent** | Understands structure, entry points, data flow, dependencies | Read-only |
| **Security Agent** | Analyses threats and required controls | Read-only |
| **Testing Agent** | Designs test strategy and coverage | Read-only during investigation |

## Invariants

1. **Only Phase 5, 7 may modify code.** Phases 1–4 and 6, 8, 9 are read-only.
2. **Verify must execute tests for real.** Inferring results from reading code is
   not verification.
3. **Security is investigated in parallel, not bolted on afterwards.**
4. **Conflicts between agents are resolved explicitly**, not silently averaged.
5. **Every stage leaves an artifact.** The chain of artifacts *is* the evidence.
