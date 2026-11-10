# Exercise 2 — verify the current Club Events checkout

Use the existing repository in Codespaces; the application is already tracked.
No ZIP archive or setup generator is needed. Use the Node 22 Codespace runtime.

1. Run `npm install`, then `npm test`.
2. Create a local demo account without putting its password in a file or commit:
   ```bash
   read -rs -p 'Choose demo password (8+ characters): ' SEED_PASSWORD
   echo
   export SEED_PASSWORD
   npm run setup
   unset SEED_PASSWORD
   ```
   An existing account keeps its existing password; setup does not reset it.
3. Run `npm start` and open forwarded port 3000. Sign in with
   `student@example.test` and your chosen password. A fresh database shows three
   future events with titles, dates and available places, ordered by date (AC-10).
4. In a second terminal, run `curl -i http://localhost:3000/events` (302 with
   `Location: /login`) and `curl -i http://localhost:3000/api/events` (401).
   Open `/events` in a private browser window too (AC-9).
5. For the deletion demonstration, use a disposable database with no reservations.
   Run `node scripts/db.mjs list`, then `node scripts/db.mjs delete 2`.
   Refresh the events page: exactly event 2 disappears. Run
   `node scripts/db.mjs restore 2` and refresh to restore it (AC-11).
   The scripts and app must use the same `DB_PATH` if it is overridden.
6. Run `node checks/ex2.mjs` (32/32) and
   `node mcp-server/check.mjs -- npm run --silent mcp` (12/12).
7. Review `SPEC.md`: AC-1–AC-4, AC-7–AC-8 and AC-17–AC-18 are the eight active whole-project
   criteria; AC-9–AC-11
   define slice 1. AC-5/AC-6 are explicitly deferred, not claimed as implemented.
   The spec-vs-result note records the discovered ordering gap and correction.
8. Review the actual evidence in `docs/exercises-1-2-evidence.md`,
   `mcp-server/README.md`, `AGENT_LOG.md` and `USAGE.md`. Complete the real-agent
   description experiment; do not replace missing statistics with made-up counts.
9. Commit and push the reviewed changes, check GitHub CI, then show the browser
   demonstration and repository to the course assistant for acceptance.

Google OAuth is specified for the complete project and remains deferred. No
Google or Gemini credentials are needed to verify slice 1. Later reservation
and poster-draft features coexist with this slice.
