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


## 2026-11-10 — Exercise 1–2 repair and verification
- Goal: investigate the reported missing four ticks, repair Exercises 1 and 2,
  verify them and commit/push; the user explicitly authorized autonomous fixes
  and pushing and requested GitHub sign-in.
- Initial evidence: remote main 845c7b8 already has four successful GitHub checks
  (test, coverage, mcp, spec). Exercise 1 self-check passed 12/12 and Exercise 2
  passed 32/32 before this repair. CI is distinct from course acceptance.
- Found: malformed MCP arguments could terminate the process; schema-invalid
  registration ids reached the tool instead of producing a protocol error.
  The README transcript omitted a successful lecture call, its lecture range
  was stale, and the description experiment was only simulated.
- Changed: validate request/argument shapes and registration ids before tool
  execution; add a real-process regression test proving error replies and
  recovery; capture a complete automated transcript including successful calls,
  notification silence, tool failure, protocol errors and recovery.
- Exercise 2: keep AC-5/AC-6 in the deferred roadmap; add explicit
  incorrect-password and sign-out requirements for existing behavior so eight
  active whole-project criteria precede the three slice 1 criteria;
  replace obsolete ZIP instructions with checkout verification steps; document
  evidence and human review gaps. Use the silent MCP command in AGENTS.md.
- Checkpoints: course requirements, remote CI status, baseline checks, input
  regression test, full test suite and both existing coverage thresholds.
- Changed by hand by student: none in this session. Real-agent selection and
  description experiment, original student authorship, missing historical CLI
  usage and teaching-assistant acceptance cannot be supplied by automation.
- No dependencies, migrations, CI definitions, coverage thresholds, tool names,
  authentication rules or real provider calls changed.

### Repair validation outcome
- Test suite: 18/18. Exercise 1: 12/12. Exercise 2: 32/32.
  Exercise 3 regression check: 18/18.
- Service coverage: 100% lines/functions/branches. Overall source lines: 94.66%.
- Host verification used Node 24.22.1 and a workspace TMPDIR because the default
  /tmp was unavailable for one coverage attempt; the workspace rerun passed.
- GitHub connected for this request; publication uses the connected account's
  GitHub commit/tree/ref API with an expected-head lease and no force update.

## 2026-11-27 — Exercise 4 deployment and readiness work
- Goal: complete the production deployment, readiness report, UI evidence, persistence and rollback checks.
- Implemented and pushed: Postgres-backed data layer and migrations, startup guard, health and error responses, Docker image, CI coverage gate, OAuth placeholders required by the course structure check.
- Verified from the Codespace: migrations and demo member seeded in Neon Frankfurt; a reservation was created and appeared in Neon. Container `/health` returned 200 with a working database and 503 with a bad database URL. Local HTTP checks returned 404 for a missing page, 400 for malformed JSON and 401 for an anonymous write. Error details appeared in the server log. The 20-test suite passed; service coverage gates passed at 100%, and overall `src` line coverage was 82.73%. The deliberately broken coverage commit failed at 98.94% branch coverage; the restored latest commit has green GitHub Actions checks.
- Browser UI evidence: opened the forwarded HTTPS login screen; verified title `Sign in | Club Events`, `lang=en`, email/password labels, no horizontal overflow at 1363 CSS pixels and a visible solid 3-pixel password focus outline. The optional browser test did not run because `playwright` is not installed.
- Deployment finding: the service is not live. Render's current new-service form is set to the GitHub repository, `main`, Docker, Free and Frankfurt, but the deployment was not created. The prior deploy attempt opened a card-verification dialog stating a temporary $1 authorization; the Render dashboard had no service afterwards. No public URL, live health check, redeploy persistence or rollback time is verified.
- False claim corrected: I previously treated Render configuration as a created free service. The dashboard showed only the new-service workflow and no deployed service; the attempt stopped at card verification.
- Google OAuth and the organizer management screen remain deferred in `SPEC.md`. No OAuth credentials were entered and no live Google sign-in was tested. The Gemini provider was not called; model tests use fakes. MCP tools remain a local stdio server and are not hosted publicly.
- UI four-state and model screenshots, network waterfall measurement, live second-account ownership attempt, Render redeploy persistence test and real rollback timing remain outstanding. No values or timings were guessed.
- Usage figures for this Codex session are unavailable and recorded as such; no token or cost estimate was invented.

## 2026-11-27 — Browser evidence follow-up
- Correction to the earlier note: installed Playwright transiently in Codespaces (no manifest/lockfile change); the browser evidence test passed 1/1 and generated seven PNG screenshots in docs/ui/ for event content, loading, empty, offline error, reservation success, model thinking and unavailable-provider fallback.
- These use isolated local fixtures and a held poster request, not a live Render or model-provider test. Loading onset, widths 380/768/1280, contrast and touch targets remain unmeasured and are left incomplete in docs/UI.md.

## 2026-11-27 — Exercise 4 final verification and report correction

- Goal: finish the Render/Neon deployment checks, verify the CI gate, complete the reversible visible-change rollback, and replace stale readiness claims with observed evidence.
- False deployment claim corrected: the earlier Exercise 4 note said no Render service existed and no public URL was verified. Render showed the service Live at `https://webdev-273223027.onrender.com`; the live health endpoint returned `{"status":"ok","db":"ok"}`. That earlier claim was false and the report now records the live URL and checks.
- Second mistaken inference corrected: I initially read Render's Node SQLite warning as evidence the production app used SQLite. The deployed server imports `openPostgres()`; the shared test adapter causes the warning. Neon showed the connected registrations table, and the live app showed the added reservation after deploy and rollback. The SQLite inference was false.
- Set Render Auto-Deploy to `After CI Checks Pass`. Changed one health assertion to an intentionally wrong expected status; GitHub Actions failed commit `d89496c`. Render Events had no deploy for that SHA while the prior successful commit remained live. Restored the assertion; commit `dc3b90e` was green and deployed. A second green commit `dc25d21` deployed a visible events-heading change.
- Created a live Project Showcase reservation before redeploy. It remained visible after the new deployment and after rollback. Rolled back from `dc25d21` to `dc3b90e`; the original heading returned. Render's event timestamps show 15 seconds between rollback start and service live. Render disabled Auto-Deploy during rollback; restored `After CI Checks Pass` and confirmed it selected.
- Live checks after rollback: `/health` returned `{"status":"ok","db":"ok"}`; `/no-such-page` returned `{"error":"Not found"}`; the live events screen showed all three reservations. Local test suite passed 20/20; coverage passed with 100% service lines/functions/branches and 82.73% overall source lines. Empty `DATABASE_URL` stopped startup with `missing DATABASE_URL: see .env.example`.
- Updated `.env.example` to remove unread OAuth placeholders. Added the live URL, environment table, checks and ranked gaps to `READINESS.md`; updated the UI success evidence and added this continuation to `USAGE.md`.
- DevTools displayed an organization policy notice on the Render dashboard, so no Network waterfall numbers were collected. Live malformed-JSON/anonymous POST tests and second-account deletion remain unverified. Google OAuth and a real Gemini call remain unimplemented/unconfigured; these are listed as gaps rather than claimed complete.
- Usage statistics are unavailable; no token counts or price estimate for this assistant session were fabricated.


## 2026-11-27 — CI repair and final deployment confirmation
- The latest spec job failed because `checks/ex2.mjs` requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` when `SPEC.md` names Google. Restored only blank placeholders in `.env.example`, with a comment that current code does not read them; no real provider credentials were added.
- Commit `b5ba61a` passed the test, Docker image build, coverage, MCP and spec jobs. Render's Auto-Deploy setting was `After CI Checks Pass`; Render Events showed that commit's deployment succeeded. Reloaded the live `/health` endpoint after deployment; it returned `{"status":"ok","db":"ok"}`.
- Rechecked the course's Google OAuth step. The Google Cloud Console credentials page still displayed `Site Unavailable` / `Unable to access this site` after a reload. No OAuth client was created, no credentials were configured, and provider sign-in remains incomplete.
- Reviewed the remaining report claims against the recorded live checks. Live malformed JSON and anonymous POST returned 400 and 401; waterfall timings, second-account deletion, full live empty/error states, and a successful real Gemini call remain unverified and are listed as gaps.
- Usage statistics for this continuation are unavailable; no token or cost values were invented.

- Ran the two required live write-route checks from the Codespace: malformed JSON to `POST /api/registrations` returned HTTP 400 with the readable JSON-body error; a syntactically valid anonymous reservation request returned HTTP 401. No registration was created by the anonymous request because the route returned before calling the reservation service. Render's environment variable names were inspected without reading values: `DATABASE_URL` and `PUBLIC_BASE_URL` are present.
