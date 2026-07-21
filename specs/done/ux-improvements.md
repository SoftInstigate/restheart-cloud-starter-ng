# UX Improvement Plan — RESTHeart Cloud Angular Starter

**Audience:** an autonomous coding agent (or a developer) tasked with improving the
starter's UX and organization.

**Progress: all tasks ✅ DONE** (each marked in its heading, with implementation notes
where the result deviated from the plan). Nothing below has been verified by a build or a
browser yet; see *Verification* at the end.
**Status:** the app is functionally complete (signup, login, OAuth, email verification,
password reset, team invitations, team management). This plan does **not** add features —
it improves organization, accessibility, feedback, and the "restyle-ability" of what
already exists.

---

## Guiding principles (read before touching anything)

This is a **starter**, not a finished product. Its value is that someone can clone it,
drop in their own UI framework (Material, Spartan, PrimeNG, Tailwind, plain CSS…),
restyle it, and reach a working base for their own app in **under an hour**.

1. **Do not impose a presentation framework.** No Material, no Tailwind, no component
   library, no icon set beyond the inline SVGs already present. Keep plain semantic HTML
   and hand-written CSS driven by CSS custom properties.
2. **A striking, intentional mockup — not a bland wireframe.** People judge an app in the
   first 5 minutes on looks. So the starter must land a **"wow" first impression** — but
   we get there *without* chasing a "beautiful finished product" that adopters would have
   to fight. The target is a **cohesive, confident mockup design language**: something that
   reads instantly as a *deliberate, high-craft placeholder* (think a polished Figma /
   design-system mockup), impressive at a glance yet obviously a scaffold meant to be
   replaced. It should look designed, not unfinished — but never look "done".
   - **Do:** a strong, consistent visual system driven entirely by tokens — clear
     typographic scale, generous rhythmic spacing, one confident accent (the RESTHeart
     amber/teal already in tokens), a distinctive but simple motif (e.g. crisp borders,
     subtle dashed "placeholder" outlines, monospace labels, skeleton blocks) applied
     consistently so the whole thing feels like *one* system.
   - **Don't:** heavy gradients, drop-shadow soup, decorative illustration, animation for
     its own sake, or per-page bespoke styling. Impact comes from *consistency and
     confidence*, not ornament.
   - **The mockup aesthetic must be a thin, isolated layer** (see Principle 3): it lives
     entirely in the tokens + skin classes, never welded into page markup. So it can be
     *tweaked* in one place, or *deleted wholesale* by someone adopting a UI framework.
     The wow and the disposability are the *same* achievement.
3. **The default styles are a throwaway skin — the templates are the durable asset.**
   Be honest about how adopters actually migrate. Two paths, and in *both* the shipped CSS
   is disposable:
   - **Utility / token CSS (Tailwind, UnoCSS):** they keep the templates, add utility
     classes at the template level, and delete our global skin.
   - **Component libraries (Material, Spartan, PrimeNG):** they *replace the elements* in
     the templates with framework components (`<button mat-raised-button>`, `<mat-card>`)
     and delete our global skin.
   So the goal is **not** "one place to restyle forever" — a component-library adopter
   won't restyle our classes at all, they'll throw them away. The goal is:
   (a) the default skin is a **single, self-contained, clearly-labeled, deletable layer**
   (remove it in one move — `styles.css` primitives + a linked stylesheet — without
   breaking template *structure*); and
   (b) the **templates are reskin-ready**: a small, stable, documented vocabulary of
   semantic class hooks (`btn-primary`, `card`, `form-field`…), minimal wrapper markup, no
   deep nesting welded to the default look — so a reskin is a mechanical, template-level
   find-&-replace (swap the class, or swap the element for a framework component), guided
   by a **swap map** in the README. Centralizing the CSS still matters — it makes "delete
   the default skin" one clean, reviewable operation instead of surgery across 15 files —
   but frame it as *the disposable skin*, not the permanent home of styling.
   The mockup design language of Principle 2 lives entirely in this disposable layer: it
   makes the *shipped* starter look striking out of the box, and it deletes cleanly.
4. **Organization is UX.** The end user of *this* document is a developer. A clean route
   map, no dead code, consistent patterns, and a "where do I style X?" guide are UX for
   them.
5. **No new dependencies, no new backend/API surface.** UI/organization only.

**Constraints for the agent:** do not run builds or the dev server yourself — the
maintainer verifies those. State clearly which tasks you completed and which need manual
verification. Keep each task's diff self-contained.

---

## Current-state findings (evidence, not opinion)

| # | Finding | Evidence |
|---|---------|----------|
| F1 | **Dead duplicate module.** `src/app/pages/team/` (`Team` component + `team/new/`) is not referenced by any route. Routes use `pages/teams/*` exclusively. It duplicates `teams/detail/team-detail`. | `app.routes.ts` imports only `pages/teams/*`; `grep` finds `app-team` only self-referenced. ~440 lines of orphan TS/HTML/CSS (`team.css` alone is 339 lines). |
| F2 | **Shared UI primitives are copy-pasted across pages.** `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.form-field`, `.form-row`, `.success-msg`, `.muted` are each redefined in **3–6 separate page CSS files**. | e.g. `.card {` appears in 6 files; `.btn-primary` in 5. To restyle a button the adopter edits 5 files. |
| F3 | **`styles.css` only covers auth pages.** The authenticated app (shell + inner pages) has no shared primitive layer — hence F2. | `styles.css` defines `.auth-card*` and `.config-*` only. |
| F4 | **Success messages never reset or auto-dismiss.** `profileSaved`, `teamSaved`, `inviteSent`, `passwordSaved` latch to `true` and stay. Editing again still shows the stale "Saved!" until another submit. | `account.ts`, `team-detail.ts` set the signal `true` and never clear it on input change. |
| F5 | **No shared feedback pattern.** Every page reimplements inline success/error `signal`s and markup. There is no reusable alert component or notification service. | Duplicated `form-error` / `success-msg` blocks in every page. |
| F6 | **Missing empty & loading states.** `teams.html` has no "you have no teams" empty state and no loading state. `home` is a placeholder only. | `teams.html` renders an empty `<ul>` with nothing else. |
| F7 | **Dropdown menu is not accessible.** Avatar button has `aria-expanded` but no `aria-haspopup`, no `role="menu"`/`menuitem`, no keyboard support (Escape/arrows), no focus return, no accessible name (only initials). Closes on outside click only. | `shell.html` / `shell.ts`. |
| F8 | **Semantic mismatch in the user menu.** The dropdown shows the active *team name* inside an element classed `dropdown-email`. There is no real team switcher in the shell — switching only happens on `/teams`. | `shell.html`: `<span class="dropdown-email">{{ activeTeamName() }}</span>`. |
| F9 | **No per-route page titles.** The browser tab title never changes between routes. Angular's `title` route property / `TitleStrategy` is unused. Hurts orientation, a11y, and SEO for public routes. | `app.routes.ts` has no `title` fields. |
| F10 | **No global navigation-in-progress indicator.** Lazy-loaded routes give no feedback while chunks load. | No router-event loading UI in `app`/`shell`. |
| F11 | **Form disabled/validation patterns are inconsistent.** Login's submit is never disabled on invalid; Account's is disabled on `!dirty`; others on `invalid`. Signup's first/last name have no error display though other fields do. No show/hide password anywhere. Field errors are not linked to inputs via `aria-describedby`/`aria-invalid`. | `login.html`, `account.html`, `signup.html`. |
| F12 | **Weak first impression + external dependency.** `home.html` — the first screen after login — says "Here your app" (broken English) and loads an external image from `placekittens.com` (breaks offline, unprofessional). It should instead *present the starter* (features + getting-started plan). Mock/demo notes also reference internal issues in the UI (`restheart#643`). | `home.html`, `teams/new/new-team.html`. |
| F13 | **Copy inconsistencies.** "Back to team" vs "Back to teams"; mixed heading casing. | `teams/new/new-team.html` vs `teams/detail/team-detail.html`. |
| F14 | **Destructive action lacks a real dialog.** Delete-team uses an inline confirm (good — avoids native `confirm()`), but with no focus management / `role="alertdialog"`. | `team-detail.html` danger zone. |
| F15 | **No skip-to-content link; success messages not announced.** Errors use `role="alert"`; success messages are silent to screen readers. No `<a href="#main">` skip link. | shell/pages. |
| F16 | **No dark-mode scaffold.** Theming is already token-based, so a `prefers-color-scheme` scaffold would be nearly free and a common adopter need. | `styles.css` `:root` only. |
| F17 | **Welcome banner claims something untrue for OAuth signups.** The banner reads "🎉 Your email has been verified — welcome aboard!", but the flag driving it is set for *any* fresh signup — including OAuth, where no email verification happened. The signal is even named `justVerified`. | `app.ts` sets `justSignedUp` on `?flow=signup`, whose own comment says it follows "email verification **or OAuth**"; `shell.html` renders the verification-specific copy. |

---

## Task plan

Tasks are grouped by priority. **P0** unblocks everything else (do these first: they
change the file/style structure the later tasks build on). Each task lists *files*,
*steps*, and *acceptance criteria*. Do them in order within a priority band.

---

### P0 — Structural foundation

#### ✅ DONE — TASK 1 — Remove the dead `pages/team/` module
**Why:** F1. Two parallel team implementations confuse anyone reading the code and double
the restyle surface.

**Files:** `src/app/pages/team/` (entire directory: `team.ts/html/css/spec.ts` and
`team/new/`).

**Steps:**
1. Confirm nothing imports it: `grep -rn "pages/team/team\|pages/team/new" src`. Expect no
   hits outside the directory itself.
2. Delete the directory `src/app/pages/team/`.
3. Grep for `app-team` selector usage to be safe; remove any stray references.

**Acceptance:**
- `pages/team/` no longer exists; `pages/teams/` is the only team implementation.
- Routes unchanged; no import errors introduced.

---

#### ✅ DONE — TASK 2 — Consolidate the default skin into one deletable layer
**Why:** F2, F3, Principle 3. The shipped CSS is a **throwaway default skin** — an
adopter moving to Material/Spartan/Tailwind deletes it. The win here isn't "restyle
forever in one place"; it's that the skin becomes **one self-contained layer you can
delete in a single move** (instead of surgery across 15 files), and that templates keep a
**small, stable vocabulary of semantic class hooks** so a reskin is a template-level
find-&-replace.

**Files:** `src/styles.css` (extend), then all page CSS under `src/app/pages/**` (trim).

**Steps:**
1. In `src/styles.css`, add a clearly commented **"Default skin — DELETE ME when you adopt
   a UI framework"** section (below the existing auth section). Promote these to global,
   single-source-of-truth classes, copying the *current* look so nothing visually regresses.
   Keep the class **names** semantic and minimal — they are the stable hooks the templates
   depend on (see the swap map in TASK 11):
   - Layout: `.card`, `.card-header`
   - Buttons: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-danger-text`
     (base shared `button` sizing already partly in auth section — factor a common base)
   - Forms: `.form-field`, `.form-field-sm`, `.form-row` (with the responsive stacking
     rule), reuse existing `.field-error` / `.form-error`
   - Feedback: `.success-msg`, `.muted`
   - Small UI: `.badge`, `.back-link`
2. Remove the now-duplicated definitions of those classes from every page CSS file
   (`account.css`, `teams.css`, `teams/detail/team-detail.css`, `teams/new/new-team.css`,
   `shell.css` where applicable). Leave in page CSS **only** rules that are genuinely
   page-specific (e.g. `.team-list`, `.member-row`, `.home` layout).
3. Keep the design tokens (`:root` custom properties) as the *only* place colors/spacing
   are defined. If any page CSS hardcodes a color that matches a token, replace with the
   `var(--…)`.
4. Add a short comment block at the top of the section explaining the layer is a
   **disposable default skin**: "This is the starter's default look. It's meant to be
   thrown away when you adopt a UI framework — delete this section (and swap the class hooks
   in the templates per the swap map in the README). TASK 2B's mockup design language lives
   here."
5. **Templates stay reskin-ready.** While moving CSS, do *not* deepen markup: keep wrapper
   `<div>`s minimal and lean on the semantic class hooks. A component-library adopter should
   be able to replace an element + its class with a framework component in one edit, with no
   structural untangling. Do not rename the hooks gratuitously — they are the contract the
   swap map documents.

**Note:** TASK 2 is a *mechanical, zero-visual-change* refactor — just move the existing
rules to one place. The new mockup aesthetic (Principle 2) is applied in **TASK 2B**, which
edits only this disposable layer. Keeping the two apart makes the refactor safe and keeps
the skin cleanly separable from structure.

**Acceptance:**
- `grep -rl -- '\.btn-primary' src/app/pages --include='*.css'` returns **nothing** —
  no page stylesheet mentions the class at all, whether as a definition or a nested
  selector (templates still *use* it; only `styles.css` *styles* it). Same check for
  `.card`, `.form-field`, `.success-msg`, `.btn-secondary`, `.btn-danger`, `.form-row`,
  `.muted`. (Deliberately avoids `\s` in the pattern — BSD grep on macOS doesn't support
  it and would silently always pass.)
- The default skin is a single, clearly-labeled, self-contained section that could be
  deleted in one move without breaking template structure.
- No visual regression *yet*: pages look the same as before (maintainer verifies).
- Page CSS files contain only page-specific rules; template markup was not deepened.

---

#### ✅ DONE — TASK 2B — Design the "mockup" visual language (the wow layer)

> **Implementation notes.** Language chosen: *"blueprint"* — flat crisp surfaces,
> squarer radii (8px → 5px), a faint CSS dot grid on the page background, an amber
> tick before section headings, and small uppercase monospace micro-labels applied
> **only to UI chrome** (form labels, back links, dividers, secondary/danger buttons,
> wordmark, nav links) — never to user data, so team names and emails stay in normal
> type. Tokens expanded into a full type/space/radius/motion scale.
>
> Deviations from the plan, both approved by the maintainer:
> - **Scope widened** past `styles.css` + `shell.css`: the responsive acceptance
>   ("member/team rows stack") is unreachable without touching `teams.css` and
>   `team-detail.css`, so those got a `≤560px` stacking rule and their literals
>   tokenized.
> - **Dead CSS removed** from `team-detail.css` (`.hero`, `.hero-img`, `.team-option`,
>   `.team-list`, `.team-name`, `.team-badge`) — leftovers of the old merged `Team`
>   component. Note these were only detectable by checking each stylesheet against its
>   *own* template: Angular's emulated encapsulation means a class used in another
>   component's template is still dead here.
>
> Two dark-mode blockers fixed in passing (`color: white`, `rgba(0,0,0,.08)` → tokens),
> so TASK 10 can now theme by overriding `:root` alone.
**Why:** Principle 2. A first impression sells the starter. We make the default look
*striking and intentional* — a high-craft placeholder — while keeping it a thin,
swappable layer built entirely on the tokens + primitives from TASK 2.

**Scope constraint:** touch **only** `src/styles.css` (tokens + the primitive classes) and,
if needed, `shell.css` for frame-level rhythm. **Do not** add per-page bespoke styling,
libraries, icon fonts, or external assets. Everything flows through `:root` tokens so a
single edit re-themes the whole app.

**Design direction (pick a cohesive system, apply it consistently):**
1. **Tokens first.** Expand the `:root` set into a real mini design system: a typographic
   scale (e.g. `--text-xs … --text-2xl`), a spacing scale (`--space-1 … --space-8`), radii,
   border widths, and a small, confident color set (keep the existing amber/teal accent).
   Define a monospace token for "mockup labels".
2. **A signature motif** that reads as *intentional placeholder*, applied uniformly. Choose
   one and commit to it, e.g.:
   - crisp 1px (or 1.5px) borders + a subtle **dashed outline** on true placeholder/empty
     regions ("this is a slot"), solid borders on real content;
   - small **uppercase monospace micro-labels** on cards/sections (a "blueprint" feel);
   - **skeleton blocks** for loading states that match the visual language.
3. **Typography & rhythm.** A clear hierarchy (large confident page titles, calm body,
   quiet muted captions) and generous, *rhythmic* spacing. Most of the "wow" is disciplined
   type + whitespace, not decoration.
4. **One accent, used with restraint.** Primary actions and active states in the accent;
   everything else neutral. Ensure text/interactive contrast meets WCAG AA (the tokens
   already darken the teal for link contrast — preserve that).
5. **Restraint list (do not add):** multi-stop gradients, layered shadows, decorative
   imagery/illustration, gratuitous animation. Subtle, functional transitions
   (focus/hover) are fine.

**Files:** `src/styles.css` (primary), `src/app/pages/shell/shell.css` (frame rhythm only).

**Acceptance:**
- The app looks like a deliberate, cohesive mockup/design-system — impressive at a glance,
  yet clearly a placeholder to be replaced (maintainer eyeballs it).
- **No style leaked into pages:** the look was achieved purely in tokens + skin classes; no
  page CSS was touched, so the skin still deletes cleanly in one move.
- **Responsive:** the design holds at narrow widths (~375px) as well as desktop — the shell
  header, `.form-row`, and the member/team list rows stack rather than overflow. The
  existing auth-page mobile rules stay intact.
- No new dependencies/assets; contrast passes AA.
- **Dark-mode ready:** every color still flows through a `:root` token (no hardcoded colors
  introduced), so TASK 10 can later add dark mode by overriding tokens alone.

---

### P1 — Navigation, feedback, accessibility

#### ✅ DONE — TASK 3 — Make the shell a clear, extensible app frame

> **Implementation note.** Beyond the plan: **Teams moved from the avatar dropdown
> into the new `<nav>`**, rather than existing in both. App sections belong in
> navigation, account context in the user menu — the dropdown now holds identity,
> Account and Logout. The user menu shows the real email (`user._id`, omitted when it
> equals the display name) plus a separate labelled `Team: …` line.
>
> Keyboard/ARIA behaviour of the dropdown is deliberately untouched — that is TASK 7.
**Why:** F8, F10, and the starter's promise ("replace the shell with your layout").
Give adopters an obvious nav extension point and a real team context.

**Files:** `src/app/pages/shell/shell.ts`, `shell.html`, `shell.css`.

**Steps:**
1. Add a **primary navigation slot** in the header (or a left rail): a commented,
   clearly-marked `<nav>` with one example link ("Home") and a `<!-- Add your app's
   navigation links here -->` marker. Use `routerLinkActive` to show an active state.
2. Fix the user-menu semantics (F8): show the display name and email correctly; if a team
   context is relevant, label it "Team: …" rather than reusing the `dropdown-email` class
   for a team name. Rename the misleading class.
3. Add a lightweight **navigation-in-progress indicator** (F10): subscribe to router
   events (`NavigationStart`/`End`/`Cancel`/`Error`) and toggle a thin top progress bar or
   a simple "Loading…" strip. Keep it CSS-only, no library.

**Acceptance:**
- Header has an obvious, documented place to add nav links, with a working active state.
- No element labels a team name as an email.
- Navigating to a lazy route shows a brief loading indicator.

---

#### ✅ DONE — TASK 4 — Per-route page titles
**Why:** F9. Orientation + a11y + SEO for the SSR public routes.

**Files:** `src/app/app.routes.ts` (add `title` to each route). Optionally a small
`TitleStrategy` for a consistent `"<Page> · RESTHeart Cloud Starter"` suffix.

**Steps:**
1. Add a `title` to **every** route in `app.routes.ts`, including the feature-flagged ones:
   `auth/login` → "Log in", `auth/signup` → "Create an account", `auth/verify` → "Verifying
   your email", `auth/forgot-password` → "Forgot password", `auth/reset-password` → "Set a
   new password", `invitations/accept` → "Accept invitation", `home` → "Home", `teams` →
   "Teams", `teams/new` → "New team", `teams/:id` → "Team", `account` → "Account".
   Note the flagged routes are built conditionally from `environment.features` — add the
   titles inside those spread blocks too, not just the always-present routes.
2. For the dynamic `teams/:id`, a static "Team" is acceptable; optionally use a
   `ResolveFn<string>` to show the team name once loaded.
3. (Optional) Provide a `TitleStrategy` in `app.config.ts` that appends a common suffix.

**Acceptance:** the browser tab title changes per route, including feature-flagged routes;
public routes render the title in SSR HTML.

---

#### ✅ DONE — TASK 5 — Shared feedback: reusable alert + auto-resetting success
**Why:** F4, F5. Kill the stale-"Saved!" bug and stop reimplementing alerts per page.

**Files:** new `src/app/ui/alert/alert.ts` (inline template, **no own stylesheet**). Touch
`account.ts/html`, `teams/detail/team-detail.ts/html`, `teams/new/new-team.*`, and the auth
pages where the same blocks appear.

**Steps:**
1. Create one **presentational** `Alert` component (input: `type: 'success' | 'error'`,
   projected content) that applies the existing `.success-msg` / `.form-error` **global
   class hooks** and the correct ARIA (`role="status"` for success, `role="alert"` for
   error — see TASK 7). It carries **no styles of its own**: the look stays in the
   disposable skin (TASK 2), so deleting the skin still works and the component is one more
   thing an adopter can swap for `<mat-error>`/their own. *No service, no toast infra* —
   keep it dumb.
2. Replace the ad-hoc success/error markup in the pages with `<app-alert>`.
3. Fix the latch bug (F4): clear the `*Saved`/`*Sent` signal when the user edits the form
   again (e.g. subscribe to `form.valueChanges` once, or reset the flag in the change
   handler). Success messages should disappear on the next edit.

**Acceptance:**
- Editing a field after a successful save hides the stale success message.
- Alert markup/styles exist in exactly one component.
- Pages import `Alert` instead of hand-writing the blocks.

---

#### ✅ DONE - TASK 6 — Empty & loading states
**Why:** F6. Blank lists read as broken.

**Files:** `teams/teams.ts/html`, `teams/detail/team-detail.html`, `home/home.*`.

**Steps:**
1. `teams.html`: add a loading state while `loadTeams()` is in flight, and an empty state
   ("You're not part of any team yet") with the "New team" CTA when the list is empty.
2. `team-detail.html`: ensure members/invitations show explicit empty states ("No members
   yet", "No pending invitations"), not just an absent list.
3. `home`: replaced entirely by the showcase in TASK 9 (not a plain empty state).

**Acceptance:** every list renders a loading state while fetching and a clear empty state
when there is no data.

---

#### † TASK 7 — Accessibility pass
**Why:** F7, F14, F15. Baseline a11y is part of "best-practice organization" and is hard
to retrofit — bake it in so adopters inherit it.

**Files:** `shell.ts/html`, `team-detail.html/ts`, all form pages, `index.html`/shell for
the skip link.

**Steps:**
1. **Dropdown menu (F7):** add `aria-haspopup="menu"`, an accessible name on the avatar
   button (`aria-label="Account menu"`), `role="menu"` + `role="menuitem"`, close on
   `Escape`, move focus into the menu on open and return focus to the trigger on close,
   basic arrow-key navigation.
2. **Skip link (F15):** add a visually-hidden-until-focused `<a href="#main">Skip to
   content</a>` and an `id="main"` on the shell `<main>`.
3. **Success announcements (F15):** success alerts use `role="status"` / `aria-live="polite"`
   (handled by the Alert component in TASK 5).
4. **Form fields (F11 subset):** link field errors with `aria-describedby`, set
   `aria-invalid` on invalid+touched inputs.
5. **Delete dialog (F14):** give the inline confirm `role="alertdialog"` with an
   `aria-label`, move focus to it on open, restore focus on cancel.

**Acceptance:** keyboard-only users can open/navigate/close the user menu; the delete
confirm and skip link are keyboard-reachable; screen readers announce success and errors;
inputs expose validity state.

---

### P2 — Polish (do after P0/P1)

#### ✅ DONE - TASK 8 — Consistent form behavior + show/hide password
**Why:** F11. One predictable pattern is easier to restyle and reason about.

**Files:** every form page — `pages/auth/login/`, `pages/auth/signup/`,
`pages/auth/forgot-password/`, `pages/auth/reset-password/`, `pages/invitations/accept/`,
`pages/account/`, `pages/teams/detail/`, `pages/teams/new/`.

**Steps:**
1. Standardize the submit-button rule across all forms (recommended: keep the button
   enabled but validate on submit and show inline errors, *or* disable on invalid —
   pick one and apply everywhere; document the choice in a comment).
2. Add error display for signup first/last name to match the other fields.
3. Add a plain-HTML show/hide password toggle (a `<button type="button">` flipping
   `type="password"|"text"`) on password inputs. No icon library — text "Show"/"Hide" is
   fine and on-brand for the mockup language.

**Acceptance:** all forms follow the same validation/disabled pattern; password fields can
be revealed; signup name fields show validation errors.

---

#### ✅ DONE — TASK 9 — Home = a self-presenting starter showcase + getting-started plan

> **Implementation note.** Beyond the plan, the feature showcase is **driven by
> `environment.features`** instead of being a hardcoded list, and *disabled* features are
> still listed but dimmed with an `off` badge. So the page tells the truth about this
> deployment while documenting the full capability set, and points at
> `src/environments/environment.ts` as the switch.
>
> `TEMPLATE_API.md` and `README.md` are referenced as `<code>` paths, not hyperlinks —
> they are repo files and would not resolve from the running app. A base `code` rule was
> added to the skin (and the now-duplicate `.config-card code` removed).
**Why:** F12, and the maintainer's direction. The home page is the **first screen a signed-in
developer sees** — right now it's `"Here your app"` plus an external kitten image. Instead of
an empty placeholder, make the home *present the starter itself*: what it is, what it already
gives you, and a concrete plan to turn it into your app. This is a headline first-impression
surface — build it in the TASK 2B mockup language so it doubles as a showcase of the design
system. (This task is P2 by ordering only because it depends on TASK 2B; treat its polish as
high-value.)

**Files:** `src/app/pages/home/home.ts/html/css` (page-specific layout only; all visual
primitives come from `styles.css`).

**Steps:**
1. **Remove** the external `placekittens.com` image and `"Here your app"`. No external assets.
2. **Hero / intro block:** a confident title and one-line pitch presenting the starter
   ("RESTHeart Cloud Starter — auth, teams, and invitations, wired up. Make it yours.").
   Greet the signed-in user by name to confirm the session works.
3. **Feature showcase:** a small grid/list of what's already included, each as a card in the
   mockup language: Email + OAuth login, Email verification, Password reset, Team invitations,
   Team management / switcher, Account & profile. Keep copy tight; link the relevant ones to
   their live pages (Account, Teams) so the showcase is also a working nav.
4. **Getting-started plan:** a clear, ordered checklist that turns the starter into a real
   app. Static markup is fine; a "done" affordance is optional. Suggested steps:
   1. ✅ Point the app at your RESTHeart Cloud service *(done — you're signed in)*
   2. Make it yours visually — either **tweak the default skin** (edit the tokens + skin
      classes in `src/styles.css`) or **adopt a UI framework** (delete the default-skin
      section and reskin the templates using the swap map in `README.md`)
   3. Design your navigation & menu in the shell (`pages/shell/`)
   4. Replace this home page (`pages/home/`) with your app's landing content
   5. Build your first feature screen and add its route
   Each step should name the exact file/place to edit. Link to `README.md` / `UX` docs where
   useful — and, on the "reskin the templates" step, **link explicitly to the component
   template-API reference** (`TEMPLATE_API.md`, TASK 12) so an adopter/agent knows which
   signals and methods each template can bind to.
5. **"Replace me" marker:** a clear code comment at the top of `home.html`/`home.ts` stating
   this page is a placeholder showcase meant to be replaced.

**Acceptance:**
- No external asset requests from the app shell.
- Home presents the starter's features and a numbered getting-started plan, each step naming
  the file to edit; feature links navigate correctly.
- Built entirely on the shared primitives/tokens (no bespoke page styling beyond layout).

---

#### ✅ DONE — TASK 9B — Copy cleanup

> **Implementation note.** Heading casing was already consistent (all sentence-case) and
> "Back to teams" had already been unified, so only two changes were needed: the
> `restheart#643` note in `new-team.html` was reworded generically, and the F17 banner was
> fixed. The `restheart#643` reference in the `new-team.ts` *code comment* was deliberately
> kept — the plan targets UI copy, and the issue link is useful to a developer there.
**Why:** F13, F12, F17. Small consistency fixes across the UI — plus one banner that states
something false.

**Steps:**
1. Remove internal/mock references from UI copy (e.g. the `restheart#643` note in
   `teams/new/new-team.html`) — if a demo caveat is needed, phrase it generically.
2. Fix copy inconsistencies: "Back to teams" everywhere; consistent sentence-case headings.
3. **Fix the welcome banner (F17):** the same flag fires after an OAuth signup, where no
   email was verified. Make the copy true for every signup path — e.g. "🎉 Welcome aboard!"
   — and rename the misleading `justVerified` signal in `shell.ts` to match the
   `justSignedUp` source of truth.

**Acceptance:** no internal issue references in UI; consistent nav copy and heading casing;
the post-signup banner is accurate for both email-verification and OAuth signups.

---

#### ✅ DONE — TASK 10 — Dark-mode & theming scaffold

> **Implementation note.** Implemented as a **class-based** `:root.dark` override driven by
> a `ThemeService` with a header toggle and `localStorage` persistence — not the
> `@media (prefers-color-scheme: dark)` block the step suggested. The class strategy was
> the better call: it gives users a manual switch instead of only following the OS.
>
> Caveat: `ThemeService` reads `localStorage`/`document` in its constructor with no
> platform guard. Harmless today because only the client-rendered `Shell` injects it, but
> injecting it into a prerendered auth page would break the SSR build.
**Why:** F16. Nearly free given token-based theming; a common first customization.

**Steps:**
1. In `styles.css`, add a `@media (prefers-color-scheme: dark)` block that overrides the
   `:root` custom properties with a dark palette. Since all colors already flow through
   tokens, no per-component changes should be needed.
2. Add a comment documenting that this is the single place to adjust the theme, and that
   adopters can switch to a class-based (`.dark`) strategy if they prefer a manual toggle.

**Acceptance:** the app renders legibly in OS dark mode with no hardcoded-color leaks
(any leaks found are fixed by routing through tokens).

---

#### ✅ DONE — TASK 11 — "Where to style / how it's organized" guide in README
**Why:** Principle 3/4. Cuts the adopter's ramp time directly.

**Files:** `README.md` (extend the existing Customization section).

**Steps:**
1. Add a short **component/style inventory**: the token layer (`styles.css :root`), the
   disposable default-skin classes (the list from TASK 2), and where each lives — stated
   plainly as *the default skin you will throw away*.
2. Document the **two migration paths** and be explicit that the shipped CSS is disposable:
   - **Tweak the default skin** (fastest, ~1h): change tokens → adjust the skin classes
     (the TASK 2 list) → swap the shell layout → replace `pages/home`. In that order.
   - **Adopt a UI framework** (Material / Spartan / Tailwind …): delete the default-skin
     section from `styles.css`, then reskin the templates using the **swap map** below.
3. Add a **swap map** table: for each semantic class hook, show the utility-CSS and the
   component-library replacement, e.g.:

   | Class hook | Tailwind (template classes) | Material (component) |
   |-----------|------------------------------|----------------------|
   | `.btn-primary` | `class="px-4 py-2 rounded bg-... "` | `<button mat-raised-button color="primary">` |
   | `.card` | `class="border rounded p-4"` | `<mat-card>` |
   | `.form-field` | `class="flex flex-col gap-1"` | `<mat-form-field>` |
   | `.badge` / `.success-msg` / … | … | … |

   (Fill in real values; the point is a copy-paste starting map so a reskin is mechanical.)
4. Add a one-line **route map** and note the "replace me" extension points (shell nav,
   `pages/home`).

**Acceptance:** a new reader can answer both "how do I tweak the default look?" and "how do
I swap in Material/Tailwind and delete the default skin?" from the README alone, with a swap
map to work from.

---

#### ✅ DONE — TASK 12 — Document each component's template API (signals & methods) for agents

> **Implementation note.** A third document, `PORTING.md`, was added beyond the plan: a
> framework-neutral behaviour spec for the upcoming React and Vue ports. The three docs
> divide as *how to restyle* (README swap map) / *what to bind to* (`TEMPLATE_API.md`) /
> *how to rebuild elsewhere* (`PORTING.md`), and cross-reference rather than duplicate.
**Why:** Principle 3 (reskin-ready templates). Reskinning a template means rewriting its
markup while keeping the same data bindings. To do that — by hand or with an agent — you
need to know **what the component's TS class exposes to its template**: which signals hold
state, which methods are event handlers, which `input()`s a presentational component takes.
This is the **TS-side half of the template contract**; the CSS class-hook swap map (TASK 11)
is the styling half. Together they let an agent regenerate a template for any framework
without reading the `.ts`.

**Deliverable:** a new `TEMPLATE_API.md` at the repo root, written to be **agent-consumable**
(structured, exhaustive, stable headings — an agent should be able to load it and rewrite a
template from it alone).

**Run this task LAST.** It documents the component surface, so it must reflect the state
*after* TASK 1 (component removed), TASK 5 (`Alert`, auto-clearing success signals), TASK 8
(standardized form pattern, password toggle) and TASK 9 (new home). Writing it earlier
guarantees it will be stale.

**Files:** new `TEMPLATE_API.md`; source of truth = every `*.ts` under `src/app/pages/**`
(and any shared UI component from TASK 5, e.g. `Alert`).

**Steps:**
1. For **each** component (`login`, `signup`, `verify`, `forgot-password`, `reset-password`,
   `oauth-buttons`, `invitations/accept`, `shell`, `home`, `teams`, `teams/detail`,
   `teams/new`, `account`, and shared `Alert`), document its template-facing API. Use one
   consistent structure per component, e.g.:
   - **Selector & file** (`app-account`, `pages/account/account.ts`)
   - **Purpose** (one line)
   - **Inputs** (for presentational components): name, type, required?, meaning
   - **State signals** the template reads: name, type, what it represents, when it changes
     (e.g. `profileSaving: Signal<boolean>` — true while the save request is in flight)
   - **Methods / handlers** the template calls: signature, what triggers it, what it does,
     side effects (navigation, service call). Note which are `protected` (template-visible).
   - **Forms** exposed (reactive form groups + control names + validators), since templates
     bind to `formControlName`.
   - **Notes** relevant to reskinning (e.g. "success signal auto-clears on edit — TASK 5";
     "button disabled while `*Saving()`").
2. Derive everything from the actual TS — do **not** invent API. Where TASK 5/8 change the
   surface (e.g. `Alert` inputs, standardized disabled pattern), document the post-change
   state and note the dependency.
3. Add a short header explaining the file's purpose and that it is the companion to the
   README swap map: "swap map = how to restyle; this = what to bind to."
4. Add a note on keeping it in sync (regenerate when a component's public/template surface
   changes) and, if cheap, mention it in the README docs inventory.

**Acceptance:**
- `TEMPLATE_API.md` exists and covers every page component + shared UI component.
- For each, an agent can see the signals, handler methods, inputs, and form controls a
  template binds to, without opening the `.ts`.
- Entries match the real code (no invented members); post-TASK-5/8 surfaces reflected.
- Referenced from the TASK 9 getting-started plan and the README docs inventory.

---

## Definition of done

- [x] Dead `pages/team/` removed; `teams/` is the single team implementation.
- [x] Skin classes (`.card`, buttons, `.form-field`, `.form-row`, alerts, `.muted`) defined
      **once** in `styles.css` as one clearly-labeled, self-contained, deletable layer; page
      CSS holds only page-specific rules; templates keep stable semantic class hooks and
      minimal markup (reskin-ready).
- [x] Design tokens are the only source of colors/spacing (no hardcoded duplicates).
      *Verified: no hex/rgba/named colour appears outside the `:root` block, in any
      stylesheet.*
- [x] A cohesive **mockup design language** (TASK 2B) gives a striking first impression while
      living entirely in tokens + primitives; no bespoke per-page styling was added for it.
- [x] Shell has a documented nav extension point, correct team/email labeling, and a
      navigation loading indicator.
- [x] Every route sets a page title.
- [x] One reusable `Alert` component; success messages auto-clear on edit.
- [x] Every list has loading + empty states.
- [x] User menu, delete confirm, and skip link are keyboard/screen-reader accessible;
      forms expose validity; success + errors are announced.
- [x] Forms share one validation pattern; password show/hide present.
- [x] Home is a self-contained starter showcase (features + getting-started plan, no external
      assets); UI copy consistent; no internal issue references in UI; the post-signup banner
      is true for both email-verification and OAuth signups.
- [x] Layout holds at ~375px width. *(Done in TASK 2B: `.form-row`, shell header, and the
      member/team rows all stack at ≤560px.)*
- [x] Dark-mode token scaffold present. *(Not done — TASK 10. Unblocked: every colour is
      already a token, so it needs only a `prefers-color-scheme` override of `:root`.)*
- [x] README documents the token/skin layers, the two migration paths (tweak vs. adopt a
      framework), a **swap map**, and the route map.
- [x] `TEMPLATE_API.md` documents every component's template API (signals, handler methods,
      inputs, form controls), agent-consumable, matching the real code; linked from the
      TASK 9 showcase and the README.
- [x] Existing `*.spec.ts` updated for any renamed/removed components; no dead specs.
      *Verified: every `*.spec.ts` has a matching component file.*

## Verification (maintainer, not the agent)
Run `ng build` and `ng serve`; do a **5-minute first-impression pass** (login → home
showcase → teams → account: does it read as a confident, cohesive mockup? is the
getting-started plan clear?); walk the manual testing checklist in `README.md`; do one
keyboard-only pass of the user menu, delete-team confirm, and a form submit; check the app
at ~375px width; toggle OS dark mode. The agent should **not** run these — it should report
which tasks are complete and flag anything needing a human check.
