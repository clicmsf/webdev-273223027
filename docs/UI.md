# UI checklist

<!-- Exercise 4 hands this in. Tick an item only when you have checked it, and replace
     the "how I checked" line with what you actually did. An unticked box is not a
     failure: it is a gap you then write into READINESS.md. A ticked box you cannot
     demonstrate at the defence is worse than an unticked one. -->

"Modern" is not a style. It is a short list of things a user notices when they are
missing: the screen tells you what is happening, you can get through it with a keyboard,
the text is readable, and nothing jumps around while it loads.

## Layout and typography

- [ ] **One spacing scale and one type scale.** Sizes come from a small set of design tokens, not from numbers typed where they were needed.
  - how I checked: Not measured; no spacing or type-token inventory was recorded.
- [ ] **Responsive at 380, 768 and 1280 pixels wide.** No horizontal scrollbar, no text running under another element.
  - how I checked: The login page had no horizontal overflow at 1363 CSS pixels; the required 380, 768 and 1280 widths were not checked.
- [ ] **Nothing jumps while the page loads.** Images and cards reserve their space before their content arrives.
  - how I checked: Not checked with a layout-shift measurement or a before/after capture.

## The four states, on every screen

A screen that only handles "it worked" is a screen that lies to the user on the day it matters.

- [ ] **Loading.** Something tells the user the app is working, within about 100 ms.
  - how I checked: Not observed in a browser; the optional Playwright run stopped because the `playwright` package was unavailable.
- [ ] **Empty.** The screen says what this list is for and what to do next, instead of showing nothing.
  - how I checked: Not observed with an empty database in a browser.
- [ ] **Error.** A sentence a person can read. Never a raw JSON body, never a stack trace, never just "Error".
  - how I checked: The API returned a short 400 response for malformed JSON, but the screen error state was not demonstrated in a browser.
- [ ] **Success.** The user can see that what they did took effect, without reloading the page to find out.
  - how I checked: A reservation row was created and visible in Neon; the success message on screen was not captured as UI evidence.

## Keyboard and accessibility

- [ ] **The main flow works with the keyboard alone.** Sign in, do the core action, sign out, without touching the mouse.
  - how I checked: Only keyboard focus on the login form was checked; the complete sign-in, reserve and sign-out flow was not run by keyboard alone.
- [x] **The focused element is visible.** A `:focus-visible` outline that is not switched off.
  - how I checked: On the forwarded HTTPS login page, the password field showed `:focus-visible` with a solid 3-pixel outline.
- [ ] **Text contrast is at least 4.5:1.** Name the tool you measured with.
  - how I checked: No contrast ratio was measured.
- [ ] **Every input has a label** a screen reader reads, not just placeholder text.
  - how I checked: The login email and password inputs had associated labels; the whole app was not audited with a screen reader.
- [x] **The page has a correct `<title>` and `lang`.**
  - how I checked: On the login page, the browser showed title `Sign in | Club Events` and `lang="en"`; the events page was not checked live.
- [ ] **Touch targets are at least 44 pixels.**
  - how I checked: Touch-target dimensions were not measured.

## The model feature

- [ ] **It shows that it is thinking.** A model call is slow and a free service may have been asleep; a frozen button is the worst possible answer.
  - how I checked: No model request or thinking-state screenshot was captured.
- [ ] **It shows when it failed,** and the rest of the screen still works.
  - how I checked: Fake-provider tests passed in the automated suite, but the browser fallback state was not opened or captured.
- [ ] **The user can tell the model's suggestion from a fact.** It is labelled as a suggestion, not presented as data the app knows.
  - how I checked: Not demonstrated with a successful model suggestion.

## Decisions

- [x] **Dark mode, or a written decision not to have one.**
  - what I decided and why: Keep one light theme for this exercise so the work can focus on readable event and reservation states; there is no dark-mode preference in the current app. This is a scope decision, not a contrast claim.

## Evidence

<!-- Screenshots of at least the four states of one screen, and of the model feature
     thinking and failing. A link to them is enough; they do not have to be in the repo. -->

No screenshot files have been saved yet. The required loading, content, empty and error states and model thinking/failing states still need browser evidence.
