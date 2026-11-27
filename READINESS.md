# Readiness report: Club Events

## 1. Live URL and how to verify it

Live URL: https://webdev-273223027.onrender.com

The Render service is live over HTTPS. `GET /health` returned `{"status":"ok","db":"ok"}`, and the live events page showed three upcoming events. I reserved Project Showcase before the next deploy. After a redeploy and rollback, the same reservation was still visible in the events page.

How I checked: opened Render and confirmed the live service, opened the health URL, reserved Project Showcase on the live events page, then reloaded that page after a deploy and after rollback. Neon Tables also showed registration rows in the connected database.

## 2. Environment variables

| Name | Purpose | Where the value comes from | Secret? | Current state |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Required Postgres connection for the HTTP app | Neon project Connect panel | Yes | Set in Render; live health and saved registrations confirm it reaches Neon |
| `PORT` | HTTP listener port | Render supplies it; local default is 3000 | No | Supplied by Render |
| `DB_PATH` | Optional SQLite file for standalone MCP when no database URL is set | Local path; default is `.local/club.db` | No | Not used by the production HTTP server |
| `SEED_PASSWORD` | Password for the one-time demo-account setup command | Chosen for `npm run setup` | Yes | Setup-only; not required by the running service |
| `GEMINI_API_KEY` | Optional key for poster suggestions | Google AI Studio | Yes | Not configured; the manual-entry fallback remains available |
| `CLUB_SESSION_TOKEN` | Authenticated identity for local stdio MCP project tools | A valid Club Events session | Yes | Local MCP only; no hosted MCP service |

How I checked: searched the application, scripts and MCP code for `process.env` reads, compared the results with `.env.example`, and ran `DATABASE_URL= npm start`. Startup exited with `missing DATABASE_URL: see .env.example`. OAuth placeholders were removed from `.env.example` because the app does not read them.

## 3. What happens when things fail

With Neon reachable, the live health endpoint returned HTTP 200 and `{"status":"ok","db":"ok"}`. The live missing route returned `{"error":"Not found"}`. Local HTTP tests showed that a failed database query returns HTTP 503 with `{"status":"error","db":"down"}`, malformed JSON to `POST /api/registrations` returns HTTP 400 with one short sentence, and a valid anonymous write returns HTTP 401. The server logs the internal error details.

I tested the CI gate with a deliberately incorrect health-test expectation. GitHub Actions failed that commit, and Render Events showed no deployment for it. After restoring the test, the next green commit deployed. I then deployed a visible heading change and rolled back to the prior deploy. Render's event times show rollback started at 7:11:35 PM and the service was live at 7:11:50 PM on 27 November 2026: 15 seconds by the Render timeline. The rollback restored the original heading. Render disabled auto-deploy during rollback; I set it back to `After CI Checks Pass` and confirmed that option was selected. I did not send malformed JSON or an anonymous write to the live endpoint.

How I checked: ran `npm test` (20/20), `npm run coverage`, and the missing-variable startup command; opened the live missing route and health endpoint; checked the failed and restored Actions runs, the Render Events page and the post-rollback service setting.

## 4. Four states of one screen

The browser test captured the events list with content, loading, empty, error/retry and reservation-success states. The live events page showed the loading message, three-event content and success message after I reserved Project Showcase. The empty and offline-error screenshots use isolated local browser-test fixtures, not live observations.

How I checked: ran `node --test browser-tests/ui.test.browser.mjs` in the earlier session and reviewed the seven linked captures in `docs/UI.md`. On the live page I saw `Loading events...`, three events after loading, and `Your place is reserved.` after the write. The reservation remained after a redeploy and rollback.

## 5. Request waterfall

I did not record a request count, dependency order or Finish time for the live events screen, so this section has no guessed timings.

How I checked: no Network-panel capture or timing note was saved for the live events page.

## 6. Security basics checked

The broad and sharper Git-history searches from the prior Exercise 4 session were reviewed; no real credential was found in the repository history. No `.env` is committed. A valid anonymous write returns HTTP 401 in the local HTTP tests. Automated tests cover refusing another account's registration deletion, but I did not attempt that deletion from a second account on the deployed site.

The session cookie uses `HttpOnly`, `SameSite=Lax`, `Path=/` and a one-day `Max-Age`; it adds `Secure` for HTTPS or `x-forwarded-proto: https`. HttpOnly prevents page JavaScript from reading the cookie, SameSite=Lax limits cross-site sends, Secure restricts it to HTTPS, and Path limits where it is sent. The live service URL uses HTTPS. Chrome displayed an organization policy notice blocking DevTools on the Render dashboard; I have no live DevTools Network capture.

How I checked: reviewed the broad and sharp searches from the prior session, inspected `src/services/auth.mjs`, checked the repo for a committed `.env`, ran the anonymous-write tests, opened the live HTTPS site and observed the DevTools policy notice. I did not run a live second-account deletion.

## 7. Known gaps, ranked by risk

1. **Google sign-in is not implemented.** The live app supports the local seeded account, so the provider sign-in step is incomplete. Next: implement Google OAuth with state and PKCE, configure a provider client and test the live callback.
   How I checked: reviewed the auth routes and `SPEC.md`; there is no provider button or callback route.

2. **Live authorization and malformed-input checks are incomplete.** I did not send malformed JSON or a valid anonymous write to the deployed API, and no second account tried to delete the first account's reservation. Next: use two test accounts and record each live HTTP status and the unchanged row.
   How I checked: the automated/local tests cover these cases, but no live request or second-account attempt was made.

3. **The live request waterfall and full live error/empty states are unmeasured.** The local browser fixtures cover empty and offline-error states; the live DevTools request count, dependencies and Finish time are missing, and the live loading onset was not timed against 100 ms. Next: capture the events page in DevTools with cache disabled and Slow 4G, then capture Offline retry and time the loader.
   How I checked: the repository has local state screenshots but no live Network capture or timings.

4. **Responsive and accessibility measurements are incomplete.** A single spacing/type scale was not audited; widths 380/768/1280, layout shift, full keyboard flow, contrast, all labels with a screen reader and 44-pixel touch targets were not checked.
   How I checked: these remain unticked in `docs/UI.md`, each with its measurement status.

5. **The real model provider and successful suggestion label were not tested.** Tests use fake clients; the live model key is not configured. Next: configure a test key, make one test request and label the suggestion clearly before comparing it with event facts.
   How I checked: inspected `src/services/poster.mjs`; no real provider request or successful suggestion was made.

## 8. Model feature

The optional poster feature sends the selected poster image, its MIME type and a short extraction prompt to Google Gemini when `GEMINI_API_KEY` is configured. It does not send member account data. With no key, the app reports that suggestions are unavailable and leaves manual entry available. No real provider request was made.

For Gemini 2.5 Flash, Google's paid standard rates checked on 27 November 2026 are $0.30 per million input text/image/video tokens and $2.50 per million output tokens, including thinking tokens. The rate-based formula for one request is `(input_tokens × $0.30 + output_tokens × $2.50) / 1,000,000`; actual token usage and request cost were not measured. Source: [Google Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

How I checked: inspected `src/services/poster.mjs`, ran tests with fake clients, confirmed the missing-key fallback, and checked Google's published pricing. No user image or account data was sent to the provider.

## 9. MCP

The project tools are `upcoming_events`, `my_registrations` and `register_for_event`; the server also retains `find_lecture` and `search_lectures`. Project tools require a valid Club Events session passed as `CLUB_SESSION_TOKEN`, then use the shared account ownership rules. The token acts as that signed-in account for the allowed operations. MCP is a local stdio process and is not publicly deployed.

How I checked: inspected `mcp-server/server.js` and `package.json`, and ran the MCP and service tests. No public MCP endpoint is configured.
