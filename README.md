# RESTHeart Cloud Starter — Angular

An Angular starter built on [`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng). Implements all RESTHeart Cloud auth and multi-tenancy flows out of the box — fork it, point it at your RESTHeart Cloud service, and start building your app.

Works for multi-tenant SaaS (invitations, team switcher) and simpler apps (auth only).

## What's included

- Signup, login, logout — email/password and Google/GitHub OAuth
- Email verification, password reset
- Team invitations — one page (`/invitations/accept`) branching into a new-user "set password" form (calls `PATCH /auth/activate`) or an existing-user "log in and accept" form
- Team switcher — shown only when the user belongs to more than one team
- Authenticated shell with placeholder for your app content
- SSR for public routes, CSR for the authenticated shell

![RESTHeart Cloud Starter Home Page](./starter-home-page.png)

## Prerequisites

1. **A RESTHeart Cloud service** — [create one at cloud.restheart.com](https://cloud.restheart.com). Use a **free** service for development, a **shared** service (or higher) for production.
2. Angular CLI (`npm install -g @angular/cli`)

## Setup

### 1. Fork and clone

```bash
git clone https://github.com/your-org/restheart-cloud-starter-ng.git
cd restheart-cloud-starter-ng
npm install
```

### 2. Point to your RESTHeart Cloud service

After cloning, tell git to ignore local changes to the dev environment file:

```bash
git update-index --assume-unchanged src/environments/environment.dev.ts
```

Then edit `src/environments/environment.dev.ts` and set `apiUrl` to your free RESTHeart Cloud service URL. Your changes will not show up in `git status`.


### 3. Configure the service

The app expects things of its service: the `accounts` plugin installed, its feature toggles
matching the app's, and your origin allowed to call it. `rhc.setup.ts` states all of that as
code, and `rhc` applies it.

> **On this branch** `rhc.setup.ts` states the [consents gate](#server-setup-required) instead —
> the two setup files are merged when the gate lands on `main`. Until then, configure the
> `accounts` plugin, its toggles and the origin allowlist from the console.

```bash
npm install -g @restheart-cloud/cli    # the rhc command; the setup file's own copy is a devDependency

rhc login                              # a personal access token, from cloud.restheart.com
rhc setup --srv <srvId> --dry-run      # what the service is missing
rhc setup --srv <srvId>                # make it so
```

`<srvId>` is the six-character id of your service — the first label of its URL.

Every step is a check and an apply, so running it against a service already configured writes
nothing and reports each step satisfied. `--dry-run` runs the checks only, which is the honest
answer to "what is this service missing".

**The setup file imports ``src/environments/environment.dev.ts``**, the same one the app imports, and derives the
service's feature toggles from it. So the flags are stated once: turn `passwordReset` off in the
app, re-run the setup, and it goes off on the service too. There is no second list to forget —
and a feature that is off on the server answers unauthenticated callers with `403`, which is a
confusing way to find out they had drifted.

### 4. Start


```bash
ng serve
```

## OpenWiki documentation

For recurring project documentation, start from the OpenWiki entry point and follow links from there:

- [openwiki/quickstart.md](openwiki/quickstart.md) — first stop, with navigation to all major topics
- [openwiki/index.md](openwiki/index.md) — generated index of OpenWiki content

Main OpenWiki topic pages:

- [openwiki/architecture.md](openwiki/architecture.md)
- [openwiki/domain-concepts.md](openwiki/domain-concepts.md)
- [openwiki/workflows.md](openwiki/workflows.md)
- [openwiki/operations.md](openwiki/operations.md)
- [openwiki/integrations.md](openwiki/integrations.md)
- [openwiki/testing.md](openwiki/testing.md)
- [openwiki/source-map.md](openwiki/source-map.md)

## Structure

```
src/
  styles.css              ← design tokens + the DISPOSABLE default skin
  environments/
    environment.ts        ← production apiUrl + feature flags
    environment.dev.ts    ← the file `ng serve` actually uses
  app/
    app.routes.ts         ← route map, titles, feature-flag gating
    app.config.ts         ← provideRhAuth() configured here
    theme.service.ts      ← light/dark toggle, persisted
    consents.ts           ← the 451 signal + the onError handler that raises it
    consents-gate.ts      ← the blocking overlay, mounted at the app root
public/
  terms.html, privacy.html ← PLACEHOLDER legal documents — replace them
    ui/alert/             ← the one shared feedback component
    pages/
      shell/              ← authenticated frame: header, nav, user menu
      home/               ← PLACEHOLDER showcase — replace with your content
      auth/               ← login, signup, verify, forgot/reset password
      invitations/accept/ ← one page, three flows (see below)
      teams/              ← list, detail (members/invites/settings), new
      account/            ← profile + change password
```

### Route map

| Path | Guard | Shown when |
|---|---|---|
| `/auth/login` | public only | always |
| `/auth/signup` | public only | `emailRegistration \|\| oauthLogin` |
| `/auth/verify` | public only | `emailRegistration` |
| `/auth/forgot-password`, `/auth/reset-password` | public only | `passwordReset` |
| `/invitations/accept` | **none** — works signed-in or out | `teamInvitations` |
| `/home`, `/teams`, `/teams/new`, `/teams/:id`, `/account` | authenticated | always |

Feature flags live in `src/environments/environment*.ts` and must match your service's
**Sign-up Mgmt → Features** toggles. A flag that's off removes the route *and* the UI that
links to it.

## Customization

### The default skin is meant to be thrown away

`src/styles.css` holds two things: **design tokens** (section 1) and a **disposable
default skin** (sections 3–5). The look is deliberately a *mockup* — cohesive and
intentional, but obviously a scaffold. `@restheart-cloud/kit-ng` ships no UI at all, so
the templates and this one stylesheet are the only places styling lives.

Two ways forward. Pick one:

**A. Tweak the skin** — fastest, roughly an hour to something that looks like yours:

1. Change the tokens in `styles.css` section 1 — colours, type scale, spacing, radii. Every
   component reads them, so this re-themes the whole app including dark mode.
2. Adjust the skin classes in section 3 if you want different shapes.
3. Replace the shell layout in `pages/shell/`.
4. Replace `pages/home/` with your own landing content.

**B. Adopt a UI framework** — Material, Spartan, PrimeNG, Tailwind, your own:

1. Delete sections 3–5 of `styles.css` (they are marked). Keep section 1 if you want the
   tokens; drop it too if your framework brings its own.
2. Reskin the templates using the swap map below.
3. See `TEMPLATE_API.md` for what each template binds to, so you can rewrite the markup
   without reading the component classes.

### Swap map

Templates reference a small, stable vocabulary of semantic class hooks. Restyle them, or
replace each element with your framework's component:

| Class hook | Used for | Tailwind (example) | Material (example) |
|---|---|---|---|
| `.card` / `.card-header` | Section container + its title row | `rounded border p-6 mb-6` | `<mat-card>` |
| `.btn-primary` | The one accented action per form | `px-6 py-2 rounded bg-amber-400 font-semibold` | `<button mat-flat-button color="primary">` |
| `.btn-secondary` | Quiet bordered action | `px-3 py-2 rounded border text-xs uppercase` | `<button mat-stroked-button>` |
| `.btn-danger` / `.btn-danger-text` | Destructive action / inline variant | `… text-red-700 border-red-700` | `<button mat-stroked-button color="warn">` |
| `.form-field` / `.form-field-sm` / `.form-row` | Label+control stack; `-sm` is narrow; `-row` lays fields side by side | `flex flex-col gap-1` / `flex gap-3` | `<mat-form-field>` |
| `.password-field` / `.btn-toggle-password` | Password input with a Show/Hide toggle | `relative` / `absolute right-2` | `<mat-form-field>` + suffix `<button mat-icon-button>` |
| `.form-error` / `.field-error` | Form-level / per-field error | `rounded border border-red-300 bg-red-50 p-3` | `<mat-error>` |
| `.success-msg` | Success feedback | `rounded border border-emerald-300 bg-emerald-50 p-3` | — (usually a snackbar) |
| `.muted` | Secondary/caption text | `text-sm text-gray-500` | `class="mat-caption"` |
| `.badge` | Small status pill | `rounded-full px-2 text-xs uppercase` | `<mat-chip>` |
| `.back-link` / `.eyebrow` | Back navigation / label above a title | `text-xs uppercase tracking-wide` | — |
| `.placeholder` / `.skeleton` | Empty-slot outline / loading block | `border border-dashed p-6` / `animate-pulse bg-gray-200` | `<mat-progress-bar mode="query">` |
| `.auth-page` / `.auth-card` / `.auth-links` / `.divider` | Centred auth layout | `min-h-screen grid place-items-center` / `w-90 rounded border p-8` | `<mat-card>` |
| `.config-page` / `.config-card` / `.config-status` / `.config-steps` | "Connect your service" screen | — | — |

Feedback is rendered through one component — `src/app/ui/alert/alert.ts` — which carries no
styles of its own, only the `.success-msg` / `.form-error` hooks plus the correct ARIA
roles. Swap that one component and every success/error message in the app follows.

Page-specific layout (`.team-row`, `.member-row`, `.feature-grid`, …) stays in the
component's own `.css` file and is not part of this contract.

### Documentation map

| File | Purpose |
|---|---|
| `README.md` | Setup, structure, and the swap map above. |
| `TEMPLATE_API.md` | What each template binds to: signals, methods, inputs, form controls. |
| `PORTING.md` | Framework-neutral behaviour spec — for building React/Vue versions at parity. |
| `openwiki/quickstart.md` | OpenWiki entry point and navigation hub for recurring docs. |
| `openwiki/architecture.md` | Architecture overview and key design choices. |
| `openwiki/domain-concepts.md` | Domain model and conceptual vocabulary. |
| `openwiki/workflows.md` | Development and contribution workflows. |
| `openwiki/operations.md` | Operational guidance and runbook-style notes. |
| `openwiki/integrations.md` | External services and integration points. |
| `openwiki/testing.md` | Testing strategy and practical testing guidance. |
| `openwiki/source-map.md` | Source navigation map for key modules and files. |

## Reading your own data

Everything the starter does talks to `/auth/*`, `/token` and `/users/me` — the kit handles
those. For your application's own collections, just use `HttpClient`:

```typescript
private readonly http = inject(HttpClient);

load() {
  return this.http.get(`${environment.apiUrl}/notes?pagesize=10`);
}
```

`provideRhAuth()` registers `rhAuthInterceptor`, which applies the session to every
`HttpClient` request bound for `apiUrl` — the bearer token, the challenge suppression that
keeps the browser's Basic Auth popup away on a `401`, and the cookie credentials. So there is
no header to attach here.

Requests to any other host pass through untouched: the token is a credential, and attaching
it everywhere would hand it to whatever third party the app happens to call.

To add an interceptor of your own, make a second `provideHttpClient` call *after*
`provideRhAuth` — `withInterceptors` registers each function as a `multi` provider, so the two
add up. Do not list `rhAuthInterceptor` again there; it is already registered, and repeating
it just runs it twice on every request.


## Consents gate

Every user must accept the current Terms of Service and Privacy Policy before they can use
the app. The rule lives on the server, as a **Guards** rule, so it applies to this app, to a
mobile client, to `curl`, and to any API integration — not just to the code below.

The client's only job is to react to a status code. Three files:

| File | Job |
|---|---|
| `app/consents.ts` | `consentsBlocked` signal + `consentsOnError`, which raises it on any `451`. |
| `app/app.config.ts` | Passes the handler to `provideRhAuth` as `config.onError`. |
| `app/consents-gate.ts` | The blocking overlay, mounted in `app.html` — **at the root, outside the router outlet**. |
| `public/terms.html`, `public/privacy.html` | Placeholder legal documents. Static, so a blocked user can read them. |

Nothing in the client knows which versions are current, and nothing reads `latestConsents`
— the permission's `mergeRequest` stamps the versions and the timestamp server-side. Bump
the versions in the console and every user meets the form again on their next request, with
nothing to redeploy here.

`RhAuthService.acceptConsents()` (kit ≥ 0.7.0) does the `PATCH`, then `GET /token?renew=true`,
then `GET /users/me`, then updates the service's `user` signal. The renewal is not optional:
a JWT is a snapshot, and without a fresh one the rule keeps blocking the user for the whole
life of the token they hold.

The overlay is user experience, not enforcement — remove it with the dev tools and every
request still comes back `451`.

### What makes the gate fire

Nothing you have to arrange. `/users/me` is one of the requests the rule blocks, and restoring
the session is the first thing the app does on load — so a blocked user trips the gate before
anything else happens. No probe, no collection to create, no path to configure.

That is also why the overlay is mounted at the **root** and not inside the shell: with
`/users/me` refused there is no session, `authGuard` fails and the navigation is cancelled.
Nothing inside the router outlet ever renders. A gate that lived there would never be seen.

`onError` is what makes it visible at all. Session restoration happens on its own schedule,
with no call site of yours to wrap in a `try`, and `authGuard` absorbs its failure — so
without the hook a blocked user and a signed-out user look identical to the app.

If your own `HttpClient` requests should raise the flag too — say the terms change while
someone is mid-session — add an interceptor that calls `consentsBlocked.set(true)` on a `451`.
The starter does not, because it makes no data requests of its own.

### The legal documents

`public/terms.html` and `public/privacy.html` are **placeholders — replace them.** Plain HTML,
no build step, no framework.

They are static files rather than app routes on purpose: a blocked user has no session, so
anything routed through the app would sit behind the gate they are trying to read their way
out of. A file in `public/` is served to anyone, in any state, and opens in a new tab without
booting the app at all.

Each carries `Version 2026-07-01` at the top. That date has to match the one in the Guards rule
and in the ACL permission — change it in all three places together, or users accept one version
while the server records another.

### Server setup (required)

Four documents on the service. [`rhc.setup.ts`](./rhc.setup.ts) states all four, and
[`rhc`](https://restheart.org/docs/cloud/cli) applies them:

```bash
npm install -g @restheart-cloud/cli    # the rhc command; the setup file's own copy is a devDependency

rhc login
rhc setup --srv <srvId> --dry-run      # what the service is missing
rhc setup --srv <srvId>                # make it so
```

`<srvId>` is the six-character id of your service — the first label of its URL. Every step is a
check and an apply, so re-running writes nothing.

**The versions live in one place.** In the article the two version strings appear four times —
twice in the permission's `mergeRequest`, twice in the rule's condition — and they have to agree
exactly. In the setup file they are `TOS_VERSION` and `PP_VERSION` at the top, and everything is
derived. Publishing new terms is editing two strings and re-running; the `Version 2026-07-01`
line in `public/` is the third place, and the only one left to keep in step by hand.

<details>
<summary>What the four documents are, if you would rather create them by hand</summary>

Enable the **Guards** plugin from *Service → Guards*, then create them in the console. Full
walkthrough: [Add Terms and Privacy Policy Acceptance](https://cloud.restheart.com/blog/require-terms-and-privacy-acceptance)
and the [Guards documentation](https://restheart.org/docs/cloud/guards#_example_gating_on_consents).

1. **A schema** (`userConsentsSchema`) allowing `latestConsents` and `consents` on the user
   document — with neither in `required`, since registration does not write them.
2. **A permission** on `PATCH /users/{userId}`, scoped with `bson-request-whitelist(consents)`
   and carrying the `mergeRequest` that stamps the versions. Without it the acceptance is a
   `403` and the user is locked out for good.
3. **Two JWT claims**: `latestConsents/tos` *and* `latestConsents/pp`. If either is missing,
   the rule blocks every token-authenticated user permanently.
4. **The rule**, blocking with `451` — excluding `/auth` and `/token`, and the acceptance
   `PATCH` itself. Note that `/users/me` is **not** excluded: it is what trips the gate.

Until those exist nothing ever returns `451`, the signal stays down, and the overlay never
renders.

</details>

## Packages used

- [`@restheart-cloud/kit`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit) — TypeScript auth logic
- [`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng) — Angular adapter
