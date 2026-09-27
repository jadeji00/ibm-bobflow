---
name: feature-delivery
description: Deliver a feature request end-to-end through the BobFlow workflow — understand, plan, investigate in parallel, synthesize, implement, verify, fix, review, and report with evidence. Use when asked to deliver a feature, implement a feature request, or run BobFlow.
---

# Skill: `feature-delivery`

> **REQUIRES IBM BOB CONFIGURATION** — the YAML front matter above follows the
> common `SKILL.md` convention. IBM Bob's actual skill discovery path and
> required fields must be confirmed against the installed Bob version before
> this file is treated as an active skill. See `docs/design.md`.

Deliver a feature request through the BobFlow workflow. Nine phases. The agent
never skips a phase, and phases 1–4 are strictly read-only.

---

## Phase 1 — Understand

Read, do not touch.

- Read `AGENTS.md` and `README.md`.
- Read the feature request.
- Locate the feature's entry points in the existing code.
- Locate the existing tests.
- **Do not modify any file.**

**Output**

```
Feature Understanding
Relevant Files
Architecture Context
Potential Impact
Unknowns
```

Mark anything you could not determine as an explicit unknown. Do not guess.

---

## Phase 2 — Plan

Still read-only.

**Output**

```
Implementation Plan
Files to Change
Files to Create
Dependencies
Testing Strategy
Security Considerations
```

Introduce no dependency that is not strictly necessary. If the plan needs a new
dependency, justify it in one line.

**Do not modify business code in this phase.**

---

## Phase 3 — Parallel Investigation

Launch all three specialist agents:

- **Architecture Agent** → `bobflow/agents/architecture-agent.md`
- **Security Agent** → `bobflow/agents/security-agent.md`
- **Testing Agent** → `bobflow/agents/testing-agent.md`

If IBM Bob supports concurrent subagent execution, **run them in parallel**.
They share no state and must not coordinate with each other.

Each agent is read-only and returns its own findings report.

---

## Phase 4 — Synthesize

The Main Agent merges the three reports into one plan.

**Output**

```
Synthesized Plan
```

Required:

- Reconcile architecture findings, security findings, and testing findings.
- **If agents conflict, state the conflict explicitly and choose one option
  with a reason.** Never silently average two incompatible recommendations.
- Carry forward every security control the Security Agent marked as required.

---

## Phase 5 — Implement

**This is the first phase allowed to modify code.**

Modify only:

- frontend
- backend
- validation
- services
- tests

Do not modify unrelated files. Preserve existing project conventions.

---

## Phase 6 — Verify

**Execute the tests for real.**

```
npm test
```

plus any additional command the project needs. Report actual output.

**Never infer test results from reading the code.** A phase 6 result that was not
produced by running a command is invalid.

---

## Phase 7 — Fix / Retest

If any test fails:

```
Analyze failure
      ↓
Identify root cause
      ↓
Modify code
      ↓
Run tests again
```

Repeat until green, **or** record explicitly that the failure could not be
resolved and why. Do not suppress a failing test to make the suite pass.

---

## Phase 8 — Review

Check, and report on each:

```
Requirement   — is every acceptance criterion met?
Architecture  — does it fit the existing design?
Security      — is every required control present?
Testing       — is coverage adequate, including negative cases?
Project Rules — does it comply with AGENTS.md?
Code Quality  — is it small and maintainable?
```

---

## Phase 9 — Delivery

Emit exactly this report:

```
BOBFLOW DELIVERY REPORT

Feature:
...

Implementation:
...

Files Changed:
...

Security:
...

Tests:
...

Verification:
...

Remaining Risks:
...

Final Status:
READY / NEEDS ATTENTION
```

`NEEDS ATTENTION` is a valid and expected outcome. Do not inflate it to `READY`.
