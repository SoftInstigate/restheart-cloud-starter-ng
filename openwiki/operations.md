---
type: Operations
title: Operations & Runbook
description: Build, serve, SSR deployment, environment configuration, CSS theming, and porting guidance for restheart-cloud-starter-ng.
tags: [operations, build, deploy, theming, porting]
resource: /angular.json
---

# Operations & Runbook

## Development

```bash
# Install dependencies
npm install

# Start dev server (uses environment.dev.ts)
ng serve
# → http://localhost:4200

# Build for production (uses environment.ts)
ng build

# Watch mode
ng build --watch --configuration development

# Run tests
ng test
```

## Environment configuration

Two environment files:

| File | Used by | Purpose |
|---|---|---|
| `src/environments/environment.dev.ts` | `ng serve` | Local development — point at a free RESTHeart Cloud service |
| `src/environments/environment.ts` | `ng build` (production) | Production — point at a shared (or higher) service |

**Setup:**
1. Edit `environment.dev.ts` — set `apiUrl` to your service URL (e.g. `https://<srvid>.eu-central-1-free-1.restheart.com`)
2. Tell git to ignore local changes: `git update-index --assume-unchanged src/environments/environment.dev.ts`
3. Match `features` flags to your service's **Sign-up Mgmt → Features** toggles

**If `apiUrl` is empty or not a `*.restheart.com` URL:** the app shows a "Connect your service" screen instead of the full app. This is intentional — see [`app.html`](../src/app/app.html).

## SSR deployment

The production build outputs:
- `dist/restheart-cloud-starter-ng/browser/` — client assets
- `dist/restheart-cloud-starter-ng/server/` — SSR server bundle

**Run the SSR server:**

```bash
# Build first
ng build

# Start the Express server
node dist/restheart-cloud-starter-ng/server/server.mjs
# → http://localhost:4000 (or PORT env var)
```

The SSR server ([`src/server.ts`](../src/server.ts)):
1. Serves static files from `/browser` with 1-year cache
2. Delegates all other requests to `AngularNodeAppEngine`
3. Listens on `PORT` env var or defaults to 4000

**Render modes** (from [`app.routes.server.ts`](../src/app/app.routes.server.ts)):
- Auth pages (login, signup, forgot/reset password): **Prerender** — static HTML
- Verify, invitations, all authenticated routes: **Client** — rendered in browser only

## CSS theming

`src/styles.css` is structured in 5 sections:

1. **Design tokens** — CSS custom properties (`:root` + `html.dark` overrides). Change these to re-theme.
2. **Dark mode** — overrides section 1 tokens under `html.dark`.
3. **Base resets** — box-sizing, body, typography.
4. **Shared primitives** — `.card`, `.btn-*`, `.form-field`, `.form-error`, `.success-msg`, `.muted`, `.badge`, etc.
5. **Auth page layout** — `.auth-page`, `.auth-card`, `.config-page`.

**Two restyling paths:**

### A. Tweak the skin (fastest — ~1 hour)
1. Change tokens in section 1
2. Adjust skin classes in section 3–5 if you want different shapes
3. Page-specific CSS stays in `src/app/pages/**/*.css`

### B. Adopt a UI framework (Material, Spartan, Tailwind)
1. Delete sections 3–5 of `styles.css`
2. Reskin templates using the [swap map in README.md](../README.md#swap-map)
3. See [`TEMPLATE_API.md`](../TEMPLATE_API.md) for what each template binds to

**Key principle:** the default skin is a disposable mockup — a "deliberate, high-craft placeholder." Templates use a small, stable vocabulary of semantic class hooks (`.card`, `.btn-primary`, `.form-field`, `.form-error`, `.success-msg`, `.muted`, `.badge`). A reskin is a mechanical find-and-replace.

The one shared feedback component — [`Alert`](../src/app/ui/alert/alert.ts) — carries no styles of its own, only the `.success-msg`/`.form-error` hooks plus ARIA roles. Swap that one component and every success/error message follows.

## Porting to other frameworks

[`PORTING.md`](../PORTING.md) is the authoritative guide. Key points:

| Layer | Portable? | What to do |
|---|---|---|
| `@restheart-cloud/kit` | 100% | Depend on it directly. Do not reimplement auth logic. |
| `styles.css` tokens + skin | 100% | Copy verbatim for visual parity. |
| Templates (HTML) | Structure yes, syntax no | Port markup, keep semantic class hooks. |
| Page CSS | Content yes, scoping no | Copy rules, swap scoping mechanism. |
| `kit-ng` (Angular adapter) | No | Rebuild equivalent for your framework. |
| Routing, guards, SSR | No | Reproduce the contract from PORTING.md. |

**Two behaviours easy to miss when porting:**
1. `checkSession()` also loads teams — screens rely on this
2. `login()` also loads teams in the same round trip

## Build budgets

From [`angular.json`](../angular.json):
- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error

## Code style

- **TypeScript:** strict mode, single quotes, 2-space indent (`.editorconfig`)
- **Prettier:** configured via `.prettierrc`
- **Angular:** zoneless change detection (no `zone.js`), signal-based state, reactive forms
- **Naming:** kebab-case for files, PascalCase for components, camelCase for signals/methods

## Common issues

### "Connect your service" screen appears
`apiUrl` is empty or not a `*.restheart.com` URL. Edit the environment file and restart.

### 403 errors on auth endpoints
Feature flags in `environment*.ts` don't match your service's **Sign-up Mgmt → Features** toggles. A feature that's enabled in the frontend but disabled server-side returns 403.

### Team-dependent UI is empty
`checkSession()` or `login()` didn't load teams. Both must load teams as a side effect — see [Architecture](architecture.md#auth-state-model).

### Token expired mid-session
The token has a 15-minute TTL with silent refresh at ~80%. If refresh fails (network issue), the next API call returns 401 and the interceptor clears the session.

### SSR build breaks with ThemeService
ThemeService touches `localStorage` and `document` — safe only in client-rendered contexts. If injected into a prerendered page, it will break the SSR build. The `isPlatformBrowser` guard is already in place.

### Demo fetch feature not working
The home page's "Fetch your data" demo requires:
1. A RESTHeart Cloud service with a `/demo` collection
2. A permission allowing the signed-in user to read it: `path(/demo) and method(GET)`
3. The user must be authenticated (the demo uses `auth.api()` which requires a valid session)

If the demo button shows an error, check:
- Network tab for the `/demo` request — verify it's being sent with the bearer token
- RESTHeart Cloud dashboard — verify the `/demo` collection exists and has the correct permission
- Console for any CORS or authentication errors

## Change navigation for operations

### For environment configuration changes
- **Start with:** `src/environments/environment.ts` and `src/environments/environment.dev.ts`
- **Check:** `src/app/app.routes.ts` for feature flag usage
- **Test with:** `ng serve` and verify "Connect your service" screen appears for invalid URLs
- **Validation:** Feature flags match your RESTHeart Cloud service's **Sign-up Mgmt → Features** toggles

### For SSR deployment changes
- **Start with:** `src/server.ts` for Express server configuration
- **Check:** `src/app/app.routes.server.ts` for render mode assignments
- **Test with:** `ng build && node dist/restheart-cloud-starter-ng/server/server.mjs`
- **Validation:** Server starts on PORT or defaults to 4000, auth pages are prerendered

### For CSS theming changes
- **Start with:** `src/styles.css` for design tokens and default skin
- **Check:** `src/app/pages/**/*.css` for page-specific styles
- **Test with:** `ng serve` and toggle theme (dark/light)
- **Validation:** Design tokens are applied correctly, dark mode works

### For build and deployment changes
- **Start with:** `package.json` for scripts, `angular.json` for build configuration
- **Check:** Build budgets (500kB warning, 1MB error for initial bundle)
- **Test with:** `ng build` and verify no budget warnings
- **Validation:** Build succeeds, SSR server starts without errors
