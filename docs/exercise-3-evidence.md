# Exercise 3 implementation and verification

Source exercise: https://webdev-course.tu-sofia.workers.dev/en/resources/exercises/3/
Source project: https://github.com/clicmsf/webdev-273223027
Starting commit: 8d1f89a. Work date: 2026-11-10. Agent: Codex.

## Run locally

Use Node 22.13+ (SQLite support); verification here used Node 25.9 on Windows.
No application dependencies were added. From this repository:

- `npm run migrate` applies the numbered migrations to `.local/club.db`.
- Set SEED_PASSWORD privately to a password of your choosing, then `npm run setup`.
  Do not paste credentials into a report or commit them. Existing passwords are not reset.
- `npm start`, then open http://localhost:3000/login and sign in as student@example.test.
- `npm test` runs the portable Node suite (16 tests at completion).
- `node checks/ex3.mjs` runs the course structural check.
- `node mcp-server/check.mjs -- node mcp-server/server.js` checks protocol conformance.
- `node --test browser-tests/ui.test.browser.mjs` runs optional browser verification when
  Playwright and Chrome are available. This session used the existing parent
  workspace Playwright installation; none was installed or added to the project.
  The harness launches its own temporary profile, with an in-memory test database.

The poster draft panel is only shown to organizers. No existing account was
promoted or altered. Browser verification creates its own temporary organizer.
Do not copy a live browser cookie. An MCP host must privately supply its own
valid application session as CLUB_SESSION_TOKEN; the service checks expiry and identity.
Without it, project tools return an authentication error. Lecture tools remain public.
The poster service uses the documented generateContent REST interface:
https://ai.google.dev/api/generate-content . All model verification used fake clients
or fake fetch responses; no real key or paid model request was used.

## Evidence

- Fresh migration and FK/unique-constraint tests passed; `npm run migrate` succeeded
  on a new local database. Opening a database again does not repopulate deleted events.
- Rule tests first failed without capacity/duplicate/date checks, then passed after implementation.
- API tests first failed with 404 before endpoints existed, then passed.
- Real HTTP lifecycle tests verified creation 201, full/duplicate 409, signed-out 401,
  another owner 403, cancellation 204, invalid id 422 and missing record 404.
- Capacity mutation: temporarily removed the capacity refusal only. Both the service
  AC-2/AC-3 test and real HTTP lifecycle test failed (2 failures, exit 1). Exact original
  service bytes were restored in a finally block and the complete suite passed.
  Raw output is kept locally in ignored `.local/capacity-mutation.txt`.
- Optional browser test passed: actual sign-in, reserve/cancel and persistence,
  visible 409 message, delayed loading, empty state, offline/retry, no-key manual
  entry, no automatic persistence, 390px layout and no uncaught page errors.
  Screenshots are in ignored `.local/exercise3-reservation-mobile.png` and
  `.local/exercise3-mobile.png`.
- Coverage commands below passed: 100% service lines/functions/branches, over 80%
  overall source lines. No coverage thresholds or CI jobs were changed.

```powershell
node --test --experimental-test-coverage --test-coverage-include=src/services/** --test-coverage-lines=100 --test-coverage-functions=100 --test-coverage-branches=100 test/*.test.mjs
node --test --experimental-test-coverage --test-coverage-include=src/** --test-coverage-lines=80 test/*.test.mjs
```

## Remaining human and remote steps

This is a local implementation, not evidence of a Gemini CLI/Codespaces session.
No claim is made of student-written criteria, plan review, architecture authorship,
manually made commits, a Gemini dayjs permission-prompt demonstration, or Gemini
usage statistics. Student review is still required by the exercise. OAuth and
organizer event CRUD remain explicitly deferred roadmap items AC-6 and AC-5.

Review `git diff 8d1f89a HEAD`, the plan and architecture draft. Rewrite the
student-owned architecture explanation in your own words. Local commits were made
by Codex under the existing Git identity, following each tested step. No push,
submission or teaching-assistant acceptance was performed. GitHub CI needs a push
before its result can be verified; do not claim local tests are a GitHub CI run.
