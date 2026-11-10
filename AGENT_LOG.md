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

### Outcome and actual checkpoints
- Restored the missing data layer; narrowed the ignore rule so src/data stays tracked.
  Numbered migrations and original tests passed before the database commit.
- New rule tests failed first for capacity, duplicate and past-event refusal; then
  passed. API tests failed before endpoint implementation and passed afterward.
- Added shared-service project MCP tools while retaining both lecture tools. Protocol
  checks pass. Removed the existing raw incoming-message log to avoid logging data.
- Model service verified only with injected fake clients/fetch; no external model call.
  Provider documentation: https://ai.google.dev/api/generate-content .
- Browser harness first had an unroute race (route already handled); fixed the test
  to await the delayed request before removing its route. Product behavior was unchanged.
- Mutation proof: removing the capacity check caused two expected test failures;
  restored exact service bytes and reran the full suite successfully.
- Windows course runner could not spawn npm (ENOENT); checks/lib.mjs now invokes
  npm's JS entry point using Node on Windows, without a shell. No check was removed.
- Service coverage passes 100% lines/functions/branches after adding fake provider
  request/HTTP-error checks. Overall source line gate passes at 80%.
- Added docs/feature-3.md as an explicitly agent-authored architecture draft and
  docs/exercise-3-evidence.md with source links, reproducible checks and human tasks.
- No new dependencies, account-data changes, remote pushes or assignment submissions.
- Changed by hand by student: none in this session. Student review is outstanding.

### Additional items found in the final diff
- Kept a Windows runner portability fix; otherwise the course check could not run here.
- Kept optional Playwright verification outside the default Node test glob so a clean
  install can run core tests without adding a browser dependency.
- Updated the old setup script to anchor /data/ as well, preventing the ignore bug
  from being reintroduced for future source files.
- Kept no-key poster drafts and MCP work because the exercise self-check requires them.
- Retained AC-5 and AC-6 in an explicit deferred roadmap rather than fake passing tests.
- Usage metrics remain unavailable; no invented token counts or billing cost.

### Final validation
- Course Exercise 3 self-check: 18/18. Exercise 2 regression check: 32/32.
- Core suite: 16/16. Optional isolated-browser scenario: passed.
- MCP conformance: 12/12. Host launcher pytest suite: 8/8.
- Existing CI-equivalent service coverage gate passed with 100% lines, functions
  and branches; overall source line gate passed above 80%.
- Full source diff reviewed against 8d1f89a; corrected a text-encoding regression
  found in README/package metadata and moved optional browser verification out of
  Node's default test-directory discovery so clean CI does not require Playwright.
- Final local tree committed. Push/remote CI and student review remain outstanding.
