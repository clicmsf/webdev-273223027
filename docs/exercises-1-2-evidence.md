# Exercises 1 and 2 — repair and verification evidence

Verified 2026-11-10 against the course briefs:
- https://webdev-course.tu-sofia.workers.dev/en/resources/exercises/1/
- https://webdev-course.tu-sofia.workers.dev/en/resources/exercises/2/

## Four GitHub checks versus course acceptance

Before this repair, main at `845c7b8` already had successful `test`, `coverage`,
`mcp` and `spec` checks in [GitHub Actions](https://github.com/clicmsf/webdev-273223027/actions/runs/42796890945).
These checks do not award course acceptance. The briefs require a real-agent
MCP demonstration and an in-room review by the course assistant as well.

## Exercise 1

- Start: `npm run --silent mcp`. Gemini and Copilot configuration files both
  launch `node mcp-server/server.js` directly, avoiding npm chatter on stdout.
- `node mcp-server/check.mjs -- npm run --silent mcp`: 12/12 checks passed.
- `test/mcp.test.mjs` sends malformed JSON, invalid message/argument shapes,
  invalid registration ids and notifications to a real child process. It checks
  the protocol errors, silence for notifications, lecture 99 as a tool error,
  and a successful lecture 5 call after the errors in the same process.
- Previously, `arguments: null` for a project tool could throw from `Object.keys`
  and terminate the process. Request and argument validation now prevents this.
  Invalid registration ids return -32602 before authentication/tool execution.
- `mcp-server/README.md` contains a fresh automated request/reply transcript,
  including successful lecture and keyword calls, missing lecture, unknown tool,
  unknown method and subsequent recovery. It corrects the lecture range to 1–12.
- Remaining evidence: the existing description experiment was simulated. Follow
  the README's real Gemini experiment and record the actual tool selection and
  `/stats`. Automation cannot supply a genuine missing historical observation.

## Exercise 2

- `node checks/ex2.mjs`: 32/32 checks passed.
- Eight active whole-project criteria are grouped before the slice sections:
  AC-1–AC-4, AC-7–AC-8, AC-17–AC-18. The last two specify existing invalid-login
  and session-revocation behavior and have real HTTP assertions. AC-5 and AC-6
  remain explicitly deferred in the roadmap. Slice 1 retains AC-9–AC-11.
- `test/slice1.test.mjs` uses real HTTP and a temporary SQLite file. It proves
  anonymous page redirect/API refusal, sign-in, three sorted future database
  rows, exact disappearance after deleting event 2, wrong-password refusal
  without a new session, and sign-out revocation.
- `SPEC.md` records the original missing ordering requirement and correction.
- `EX2_STEPS.md` gives current checkout, account setup and browser verification
  commands, replacing obsolete instructions to upload an unavailable ZIP.
- Remaining human review: show sign-in and deletion/refresh in the Codespace
  browser, review the criteria and authorship, and request course acceptance.

## Regression checks

Commands use the unchanged CI thresholds:

```bash
npm test
node --test --experimental-test-coverage \
  --test-coverage-include='src/services/**' --test-coverage-exclude='test/**' \
  --test-coverage-lines=100 --test-coverage-functions=100 --test-coverage-branches=100
node --test --experimental-test-coverage \
  --test-coverage-include='src/**' --test-coverage-exclude='test/**' \
  --test-coverage-lines=80
node checks/ex2.mjs
node mcp-server/check.mjs -- npm run --silent mcp
node checks/ex3.mjs
```

Final local results: 18/18 tests, Exercise 1 12/12, Exercise 2 32/32,
Exercise 3 18/18; service coverage 100% lines/functions/branches and overall
source line coverage 94.66%.

The repair was verified locally with Node 24.22.1; the existing CI uses Node 22.
This host needed `TMPDIR` set to a writable workspace temporary directory for
coverage; the initial default `/tmp` attempt failed before the affected tests
could run, and the rerun passed. No repository workaround or CI change was made.
Token usage is unavailable; `USAGE.md` records that honestly rather than inventing
counts. No external model, account-linking or authentication-rule change is part
of this repair.
