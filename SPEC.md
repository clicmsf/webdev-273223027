# Club Events - Student Clubs

## Project option
Club events.

## Goals
- Members sign in and browse upcoming club events with dates and available places.
- Members can reserve or cancel a place, and organizers can manage events and registrations.
- The same account will eventually support local password and verified Google sign-in.

## Non-goals
- No payments or ticket purchases: every event is free.
- No email, SMS or push notifications: members check the website.
- No native Android or iOS application: the web interface works on mobile.
- No public self-registration in slice 1: use an account created during setup.

## Constraints
- Node.js 22 built-in HTTP server and SQLite, with plain HTML, CSS and JavaScript.
- Passwords are saved as salted scrypt hashes and never saved as readable text.
- HTTP routes and future MCP tools must share business services; SQL stays in `src/data/`.
- Session cookies are HttpOnly and SameSite=Lax; the event list is unavailable without a session.
- No real model or OAuth credentials are committed to Git.

## The model feature
- Model: Gemini 2.5 Flash, implemented in `src/services/poster.mjs` with an injected client for tests.
- Input: an organizer-uploaded event-poster image, without any member account data.
- Output: a proposed event title, date and location that an organizer reviews before saving.
- When it fails: on timeout, missing `GEMINI_API_KEY`, 429, or invalid output, show an empty manual-entry form and the message "Automatic suggestions unavailable; enter event details manually." No data is saved automatically. The organizer preview is implemented in slice 2; no event is saved automatically.

## Auth
- Local: email and password, salted scrypt hash, and a secure random session in an HttpOnly cookie.
- Provider: Google OAuth 2.0 authorization-code flow with state and PKCE (planned for Exercise 3+).
- Linking: an authenticated user may link a Google account; an email is matched only when Google confirms it is verified and the account linking is explicitly confirmed. Both methods lead to one user record.

## MCP tools
| Tool | What it does | Who may call it |
| --- | --- | --- |
| `upcoming_events` | Returns upcoming club events with free-place counts from the database | signed-in member or organizer |
| `my_registrations` | Lists registrations belonging to the authenticated account only | the authenticated account owner |
| `register_for_event` | Reserves a place when capacity permits and rejects fully booked events | the authenticated account owner |

## UI
Plain HTML, CSS and client-side JavaScript. Planned screens: local/Google sign-in, upcoming event list, event detail and registration screen, organizer event management. Each screen needs loading, empty, error and success states. Slice 2 adds reservation/cancellation and an organizer-only poster draft panel. See `docs/UI.md` for the future checklist.

## Architecture
- Server: `src/routes/http.mjs` authenticates a request and maps service results/errors to HTTP. `src/services/registrations.mjs` owns capacity, duplicate and ownership rules; `src/data/db.mjs` owns SQL and transactions.
- Browser: `public/events.html` hosts the view; `public/events-client.mjs` owns screen state, REST requests and rendering. MCP calls the same services with a validated session identity.
- The complete agent-written request trace, deliberate layering mismatch and student-review requirements are in `docs/feature-3.md`. This is a review draft, not a claim of student authorship.

## Acceptance criteria
- [AC-1] A signed-in member opening the events list sees only future events sorted by date, with available places displayed.
- [AC-2] A member reserving a free place sees a confirmation, and a registration row appears in the database.
- [AC-3] A member trying to reserve a full event receives HTTP 409 and sees "This event is full"; no new registration appears.
- [AC-4] A member cancelling their own reservation sees the place become available again, while another member's reservation remains unchanged.
- [AC-7] An organizer using poster suggestions with no model key sees "Automatic suggestions unavailable; enter event details manually" and can still fill in the form themselves.
- [AC-8] The MCP tool `register_for_event` uses the same capacity rule as the HTTP API and refuses a full event without inserting a registration.

### Slice 2: event reservations
- [AC-12] A duplicate reservation returns 409 without creating a second row.
- [AC-13] Anonymous reservation and cancellation return 401; cancellation of another member's reservation returns 403 without changing it.
- [AC-14] Missing events/registrations return 404; invalid event ids return 422; past events reject reservations with 409.
- [AC-15] The reservation screen shows loading, actionable empty, success, and readable error/retry states.
- [AC-16] Model suggestions use valid title/date/location only; invalid output, unavailable provider or timeout yields manual entry, and saves nothing.

### Slice 1: sign-in and the upcoming events list
- [AC-9] A visitor opening `/events` without signing in is redirected with HTTP 302 to `/login`; `/api/events` returns HTTP 401 without a session.
- [AC-10] After signing in with the seeded student account, `/events` lists the three seeded upcoming events, ordered by date, with each title, date and free-place count.
- [AC-11] Deleting one of the three event rows from SQLite and refreshing `/events` removes exactly that event without changing the other two.

## Traceability
| Criterion | Test |
| --- | --- |
| AC-1 | `test/reservations-api.test.mjs`: real HTTP lifecycle; `test/slice1.test.mjs`: sorted future events |
| AC-2 | `test/registrations.test.mjs`, `test/reservations-api.test.mjs`, `browser-tests/ui.test.browser.mjs`: persistence and confirmation |
| AC-3 | `test/registrations.test.mjs`, `test/reservations-api.test.mjs`: full event; browser test: readable 409 message |
| AC-4 | `test/registrations.test.mjs`, `test/reservations-api.test.mjs`, `browser-tests/ui.test.browser.mjs`: cancellation |
| AC-7 | `test/poster.test.mjs`, `browser-tests/ui.test.browser.mjs`: no-key manual entry |
| AC-8 | `test/mcp.test.mjs`: real stdio calls, same capacity rule |
| AC-9 | `test/slice1.test.mjs`: redirect and unauthorized API |
| AC-10 | `test/slice1.test.mjs`: seeded sign-in and sorted list |
| AC-11 | `test/slice1.test.mjs`: database deletion reflected in API |
| AC-12 | `test/registrations.test.mjs`, `test/reservations-api.test.mjs`: duplicates |
| AC-13 | `test/registrations.test.mjs`, `test/reservations-api.test.mjs`: 401 versus 403 |
| AC-14 | `test/registrations.test.mjs`, `test/reservations-api.test.mjs`: missing/invalid/past |
| AC-15 | `browser-tests/ui.test.browser.mjs`: loading, empty, success, error and retry |
| AC-16 | `test/poster.test.mjs`: valid/nonsense/no-answer/timeout/fake HTTP provider |

## Spec vs result
- Slice 1 and slice 2 implemented criteria pass local automated verification; see `docs/exercise-3-evidence.md` for commands and limitations.
- Gap in the initial requirement: it specified three upcoming rows but did not state which order to show them in.
- Changed in this spec: AC-10 now explicitly requires date ordering. `src/data/db.mjs` sorts by event date, and the AC-10 test checks that ordering.
- This session used a local Windows checkout with Codex and isolated Chrome, rather than Gemini in Codespaces. Student plan review, architecture authorship and teaching-assistant acceptance remain human tasks.

## Deferred roadmap (outside this exercise acceptance scope)
- [AC-5] An organizer creating a valid event sees it on the events list; an ordinary member attempting the same operation receives HTTP 403.
- [AC-6] A user who links a verified Google identity to their existing local account signs in to the same user id and no duplicate account is created.

AC-5 organizer event creation and AC-6 Google linking remain unimplemented; their original requirements are retained here, not presented as passing criteria.
