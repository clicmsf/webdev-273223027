# Agent log

## 2026-10-27 - Planning and slice 1 implementation
- Goal: implement the SPEC.md slice 1, AC-9 through AC-11.
- Work completed: review the requirements, prepare the implementation plan, create the SQLite-backed sign-in and events list, and add automated tests.
- Checkpoints: reviewed the plan against non-goals; verified persistent SQLite tables; tested signed-out redirects and deletion reflected in the list. Browser verification in Codespaces remains to be completed by the student.
- Gap discovered: the initial acceptance criterion did not specify the order of upcoming events.
- Updated: AC-10 now requires chronological order; SQL uses date ordering and the test asserts it.
- Usage: the course CLI was unavailable, so no CLI session statistics are available.

## 2026-11-10 - Exercise 3 autonomous local implementation
Goal: complete the Club Events reservation slice in the new FIP checkout.
Autonomy: user explicitly requested maximum autonomy. Codex may implement, run checks,
review diffs and make local step commits. No push, assignment submission, real model call,
new dependencies or changes to existing account rules without explicit authorization.
Checkpoints chosen before code: written plan; fresh migration; rule red/green tests;
real HTTP status tests; shared-service MCP tests; UI loading/empty/error checks;
mutation check; final course self-check and full diff review.

Plan (prepared before implementation; agent reviewed, student review outstanding):
1. Repair the missing tracked database module and add numbered SQLite migrations, a
   migration runner and fresh-database tests. The existing ignore pattern data/ also
   ignores src/data; narrow it. Preserve existing slice 1 behavior.
2. Test reservation rules first, then implement transaction-protected capacity and
   duplicate checks in services, plus owner-only cancellation and list-own records.
3. Add authenticated POST/DELETE endpoints and real HTTP tests for 201/204,
   409 full/duplicate, 401 anonymous, 403 other owner, 404 and invalid input.
4. Extend the existing MCP server with the three specified project tools through
   these same services; validate session identity rather than trusting a user id.
5. Implement the planned poster suggestion service with injected fake tests,
   timeout, strict result validation and deterministic manual-entry fallback.
   Keep OAuth and organizer CRUD explicitly deferred; do not pretend to test them.
6. Add reservation controls, loading/empty/error/retry states and isolated browser
   verification. Document architecture, traceability, evidence and remaining human work.

Changed in review: use a transaction for check-and-insert; differentiate 401/403;
restore missing src/data module; explicitly separate deferred OAuth/organizer criteria
from implemented acceptance criteria so traceability is honest. The self-check requires
both the model service and three project MCP tools, so include those planned components.
This is Codex's review, not a claim of student review or hand-written student text.

## What the agent did that I did not ask for
- Discovered src/data/db.mjs was absent in Git because data/ ignored it; repair required.
- Will repair the existing MCP CommonJS/module mismatch to run under package type module.
- Adds no npm dependencies; model tests use fakes and no user data leaves the machine.
- Adds implementation evidence and a student-review checklist because the assignment
  reserves plan review, architecture authorship and defence for the student.
