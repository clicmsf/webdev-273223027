# Instructions for the agent

Read this file at the start of every session. See `SPEC.md` for the project contract.

## Project
Club Events helps students view upcoming student-club activities and, later, register for places. Slice 2 adds reservations, owner-only cancellation, shared-service MCP tools and poster drafts.

## Commands
- Install: `npm install`
- Run: `npm start` (visit the forwarded port 3000)
- Test: `npm test`
- Migrate: `npm run migrate` (applies pending Postgres migrations to `DATABASE_URL`)
- Browser verification: `node --test browser-tests/ui.test.browser.mjs` (optional Playwright installation required; separate temporary profile)
- Self-check: `node checks/ex3.mjs`
- Coverage: the existing CI commands enforce 100% service lines/functions/branches and 80% overall lines; no threshold changes.
- MCP server: `npm run --silent mcp` (retains lecture tools and adds three project tools; project identity comes from CLUB_SESSION_TOKEN, validated through the session service)

## Conventions
- HTTP routing lives in `src/routes/`, business logic in `src/services/`, and database access with SQL only in `src/data/`.
- The UI lives in `public/`; use 401 for API authorization errors, 302 for protected HTML pages, and JSON for API responses.
- Exercise 3 implements registrations and poster drafts; Google OAuth and organizer event CRUD remain deferred.

## Layers
- HTTP route handler: `src/routes/http.mjs`
- Service layer: `src/services/`
- Data access: `src/data/db.mjs`
- MCP tools: `mcp-server/` (Exercise 1) now; future project tools call the same service functions as HTTP.

## The model feature
- The planned provider is Gemini 2.5 Flash, and the future single call site will be `src/services/poster.mjs`.
- Read `GEMINI_API_KEY` only from the environment. No key means a manual-entry fallback.
- Time out external calls and provide a manual-entry fallback without saving guesses.
- Test model behavior using a fake client rather than a real API. Only send an image when an organizer explicitly requests suggestions; never send account data.

## The MCP server
- Lives in `mcp-server/`, grown out of Exercise 1.
- Every future project tool must call a service function, never the database directly.
- It carries an authenticated user and applies the HTTP API's authorization rules.
- When adding a project tool, also update the MCP table in `SPEC.md`.

## Tests and coverage
- Test titles name acceptance criteria, such as AC-9, AC-10 and AC-11.
- Exercise 3 adds full coverage and traceability; do not weaken tests to hide faults.

## Always ask before
- deleting files or folders
- editing a migration that has already run
- installing or removing dependencies
- pushing, tagging or changing CI
- anything that touches secrets or `.env`
- changing an authentication or authorization rule
- adding, renaming or removing an MCP tool
- changing a coverage threshold
- sending user data to a third-party model

## Never
- commit secrets, passwords, API keys or an OAuth client secret
- weaken or delete a test to make it pass
- lower a coverage threshold or switch off a CI job to make the build green
- add an MCP tool that reaches past the service layer
- log a prompt that contains somebody's personal data
