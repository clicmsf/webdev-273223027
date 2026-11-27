# Readiness report: Club Events

## 1. Live URL and how to verify it

There is no verified public URL yet. The Render configuration form has the repository, `main`, Docker, Frankfurt and Free selected, but no service has been created, so `course.json` remains blank. I will not put a predicted `onrender.com` address in the course manifest. A local container answered successfully, but that is not a public deployment and does not prove Render health.

How I checked: the Render dashboard remained on “New Web Service”; the earlier deployment attempt opened card verification with a stated temporary $1 authorization and no service appeared. Locally, the container health endpoint returned 200 when Neon answered.

## 2. Environment variables

| Name | Purpose | Where the value comes from | Secret? | Current deployment state |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Required Postgres connection | Neon project Connect panel | Yes | Neon is configured locally; not entered in Render |
| `PORT` | HTTP listener | Render supplies it; local default is 3000 | No | Not applicable until deploy |
| `DB_PATH` | Optional SQLite path for standalone MCP when Postgres is unset | Local default `.local/club.db` | No | Not used by the Render HTTP server |
| `SEED_PASSWORD` | Password used by the one-time demo-account setup script | Chosen locally for setup | Yes | Not needed by the running server |
| `GEMINI_API_KEY` | Optional poster suggestions | Google AI Studio | Yes | Not configured; manual-entry fallback remains available |
| `CLUB_SESSION_TOKEN` | Authenticated identity for local stdio MCP project tools | A valid Club Events session | Yes | Not configured in Render; MCP is local |
| `GOOGLE_CLIENT_ID` | Placeholder for future Google OAuth | Google Cloud OAuth client | No | Unused; OAuth is deferred |
| `GOOGLE_CLIENT_SECRET` | Placeholder for future Google OAuth | Google Cloud OAuth client | Yes | Unused; OAuth is deferred |

How I checked: compared `.env.example` with the startup, migration, setup, model and MCP code. The only variable required by the production HTTP startup is `DATABASE_URL`; the other values are optional, local-only, setup-only, or deferred.

## 3. What happens when things fail

With the database reachable, `GET /health` returned HTTP 200 and `{"status":"ok","db":"ok"}`. With a deliberately bad database address, it returned HTTP 503 and `{"status":"error","db":"down"}`. A missing path returned 404. Malformed JSON to a write route returned 400 with a short response; a valid anonymous write returned 401. The error details went to the server log.

A Render rollback has not been attempted because no Render service exists. There is no measured rollback duration.

How I checked: ran the container with the working Neon URL and again with a bad URL, then used local HTTP requests for the missing route, malformed JSON and anonymous write. I inspected the server log for the error detail.

## 4. Four states of one screen

The events screen's code has a loading message, a content list, an actionable empty message, an alert with retry on request failure, and a success message after a reservation change. I have not demonstrated all four states in a browser or saved the requested screenshots, so these remain unverified UI claims.

How I checked: inspected `public/events-client.mjs`; the optional Playwright run stopped because the `playwright` package was unavailable. I did not claim the source strings as observed states.

## 5. Request waterfall

No request count, Finish time or dependency order has been recorded. I did not measure the events screen in DevTools with cache disabled.

How I checked: there is no saved Network panel capture or timing note from this session; no request total or duration is reported.

## 6. Security basics checked

- The repository and commit history secret search found placeholders, variable names and code expressions, not an actual secret. No `.env` was committed.
- Anonymous write access was refused with HTTP 401. Automated service and HTTP tests cover the separate owner-only rule; I did not attempt the live second-account delete described by the lab.
- The session cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, and has a one-day `Max-Age`. It adds `Secure` when the request is HTTPS or carries `x-forwarded-proto: https`. HttpOnly prevents page JavaScript from reading it; SameSite=Lax limits cross-site cookie sending; Secure restricts it to HTTPS; Path limits where the browser sends it.
- The forwarded Codespace login page loaded over HTTPS without a browser security warning. There is no public production URL to check.

How I checked: ran the broad and sharper Git-history searches; inspected the cookie construction in `src/services/auth.mjs`; confirmed the anonymous API status in local HTTP checks and the owner rule in passing tests; opened the forwarded login page in the browser.

## 7. Known gaps, ranked by risk

1. **No public deployment or live production check.** Render has no service yet, so public HTTPS, live `/health`, Render environment values and production startup are unverified. Next: complete Render account verification, set the deployment environment, deploy and run the course self-check against the actual URL.  
   How I checked: the Render dashboard still shows the new-service configuration and no deployed service; there is no live URL in `course.json`.

2. **Google sign-in is not implemented.** The project specification defers OAuth; no provider button, redirect flow or live callback is available. Next: implement the state/PKCE flow and configure an OAuth client before claiming provider sign-in works.  
   How I checked: checked `SPEC.md` and the auth routes; `.env.example` contains unused placeholders only.

3. **Required UI evidence is incomplete.** The four states, model thinking/failure, requested screenshots, 380/768/1280 widths, contrast and touch-target sizes have not all been checked. Next: run the browser checks, capture the required evidence and keep unsupported items unticked.  
   How I checked: reviewed `docs/UI.md`; the optional browser test could not import `playwright`, and no screenshots are saved.

4. **Persistence across a production redeploy and rollback are unverified.** A reservation is present in Neon, but it has not been created on a live Render site, survived a Render redeploy, or been restored by rollback. Next: record a recognizable live row, redeploy, reload and time a real rollback.  
   How I checked: Neon showed the locally created row; no Render service or deploy event exists.

5. **No live cross-account authorization attempt or real model-provider outage test.** Automated tests exercise owner rules and fake-provider fallbacks, but no second signed-in account or provider request was used in the browser. Next: run those checks with test accounts after deployment; do not send real account data to the model.  
   How I checked: the 20 local tests passed; the real Gemini provider was not called, and the live delete attempt was not performed.

## 8. Model feature

The optional poster feature sends the uploaded event-poster image, its MIME type and a short extraction prompt to Google Gemini when a key is configured. It does not include member account data. The feature returns a draft for organizer review and does not save the event automatically. With the key missing, the app falls back to manual entry. No real provider request was made in this run.

As checked on 27 November 2026, the provider's standard paid list rates were $0.30 per million input tokens and $2.50 per million output tokens (including thinking tokens). One call costs `(input_tokens × $0.30 + output_tokens × $2.50) / 1,000,000`; the exact request cost cannot be stated without measured image, prompt and response token counts. This is a rate-based calculation, not a measured charge.

How I checked: ran `npm test` with injected fake clients and checked Google's published Gemini API pricing. No image, key or account data was sent to the provider.

## 9. MCP

The project tools are `upcoming_events`, `my_registrations` and `register_for_event`; the server also retains `find_lecture` and `search_lectures`. The project tools use the session represented by `CLUB_SESSION_TOKEN`, then apply the same account ownership rules as the HTTP services. A token therefore acts as that signed-in account for the allowed project tools. The MCP server is a local stdio process and is not publicly deployed.

How I checked: the 20-test suite includes MCP protocol and service checks; I inspected the server entry point and confirmed the Codespace command is local stdio. No public MCP endpoint exists.
