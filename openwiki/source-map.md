---
type: Source Map
title: Source Map
description: File-by-file guide to the restheart-cloud-starter-ng repository, organized by domain area.
tags: [source-map, navigation, files]
resource: /src/
---

# Source Map

## Root configuration

| File | Purpose |
|---|---|
| [`package.json`](../package.json) | Dependencies, scripts (`ng serve`, `ng build`, `ng test`) |
| [`angular.json`](../angular.json) | Angular CLI config — build options, SSR entry, budgets |
| [`tsconfig.json`](../tsconfig.json) | TypeScript strict mode, Angular compiler options |
| [`tsconfig.app.json`](../tsconfig.app.json) | App-specific TS config |
| [`tsconfig.spec.json`](../tsconfig.spec.json) | Test-specific TS config |
| [`.editorconfig`](../.editorconfig) | 2-space indent, single quotes for TS, no trailing whitespace trim for MD |
| [`.prettierrc`](../.prettierrc) | Prettier formatting config |
| [`.gitignore`](../.gitignore) | Standard Angular ignores + `.vscode` |

## Environments

| File | Purpose |
|---|---|
| [`src/environments/environment.ts`](../src/environments/environment.ts) | Production config — `apiUrl` (empty by default) and `features` flags |
| [`src/environments/environment.dev.ts`](../src/environments/environment.dev.ts) | Development config — used by `ng serve`. Edit this for local dev. |

Both export `{ apiUrl, features }`. The `features` object controls which auth/team capabilities are enabled. See [Domain Concepts](domain-concepts.md#feature-flags).

## App bootstrap

| File | Purpose |
|---|---|
| [`src/main.ts`](../src/main.ts) | Client bootstrap — calls `bootstrapApplication(App, appConfig)` |
| [`src/main.server.ts`](../src/main.server.ts) | Server bootstrap — merges `appConfig` with server rendering config |
| [`src/server.ts`](../src/server.ts) | Express 5 SSR server — static files + Angular SSR handler. Listens on `PORT` or 4000 |
| [`src/index.html`](../src/index.html) | HTML shell |

## App root

| File | Purpose |
|---|---|
| [`src/app/app.ts`](../src/app/app.ts) | Root component — checks `apiUrl` validity, consumes fragment tokens on browser load |
| [`src/app/app.html`](../src/app/app.html) | Either `<router-outlet>` or "Connect your service" setup screen |
| [`src/app/app.config.ts`](../src/app/app.config.ts) | `provideRhAuth()`, router, hydration, title strategy |
| [`src/app/app.config.server.ts`](../src/app/app.config.server.ts) | Merges client config with `provideServerRendering()` |
| [`src/app/app.routes.ts`](../src/app/app.routes.ts) | Route map with lazy-loaded components, feature-flag gating, `AppTitleStrategy` |
| [`src/app/app.routes.server.ts`](../src/app/app.routes.server.ts) | SSR render modes per route (Prerender vs Client) |
| [`src/app/just-signed-up.ts`](../src/app/just-signed-up.ts) | Global signal — `true` for one page load after fresh signup (email or OAuth) |
| [`src/app/oauth-url.ts`](../src/app/oauth-url.ts) | Builds redirect URL for `GET /auth/oauth/authorize/{provider}` |

## Shared UI

| File | Purpose |
|---|---|
| [`src/app/theme.service.ts`](../src/app/theme.service.ts) | Dark/light mode toggle, persisted to `localStorage['rh-theme']`. Only injected by Shell (client-rendered). |
| [`src/app/ui/alert/alert.ts`](../src/app/ui/alert/alert.ts) | The one shared feedback component. Renders `.success-msg`/`.form-error` hooks with correct ARIA roles. Auto-dismisses after 4s by default. |
| [`src/styles.css`](../src/styles.css) | Global stylesheet: design tokens (section 1), dark mode overrides (section 2), disposable default skin (sections 3–5). **Meant to be thrown away.** |

## Auth pages

| Directory | Component | Key behavior |
|---|---|---|
| [`src/app/pages/auth/login/`](../src/app/pages/auth/login/) | `Login` | Email/password form. Calls `auth.login()`. Shows OAuth buttons if `oauthLogin` flag is on. |
| [`src/app/pages/auth/signup/`](../src/app/pages/auth/signup/) | `Signup` | Registration form with first/last name. Calls `auth.register()` with auto-generated team name. |
| [`src/app/pages/auth/verify/`](../src/app/pages/auth/verify/) | `Verify` | Email verification — calls `auth.verify()` which returns a redirect URL with `#access_token=...`. Client-rendered only. |
| [`src/app/pages/auth/forgot-password/`](../src/app/pages/auth/forgot-password/) | `ForgotPassword` | Email form. API always returns 202 regardless of whether email exists. |
| [`src/app/pages/auth/reset-password/`](../src/app/pages/auth/reset-password/) | `ResetPassword` | New password form. Reads `email` and `token` from query params. Calls `auth.resetPassword()`. |
| [`src/app/pages/auth/oauth-buttons/`](../src/app/pages/auth/oauth-buttons/) | `OauthButtons` | Shared component — renders provider buttons that link to `oauthUrl(provider)`. |

## Invitation flow

| File | Purpose |
|---|---|
| [`src/app/pages/invitations/accept/accept.ts`](../src/app/pages/invitations/accept/accept.ts) | Three-way branching: new user (set password → `activate`), logged-in user (accept directly), existing user (login then accept). Reads `email`+`token` from query params. |
| [`src/app/pages/invitations/accept/accept.html`](../src/app/pages/invitations/accept/accept.html) | Template with `isNewUser`, `isAuthenticated`, and login branches. |

## Team management

| File | Purpose |
|---|---|
| [`src/app/pages/teams/teams.ts`](../src/app/pages/teams/teams.ts) | Team list — loads teams, shows active/switch buttons. |
| [`src/app/pages/teams/new/new-team.ts`](../src/app/pages/teams/new/new-team.ts) | Create team form. Calls `auth.createTeam()`. |
| [`src/app/pages/teams/detail/team-detail.ts`](../src/app/pages/teams/detail/team-detail.ts) | Team detail — members list, invitations, invite form, team settings, danger zone (delete). Owner-only sections gated by `isOwner()`. Reactive cooldown timer for invite resend. |

## Account

| File | Purpose |
|---|---|
| [`src/app/pages/account/account.ts`](../src/app/pages/account/account.ts) | Profile edit (first/last name) + change password. `currentPassword` is optional for OAuth users. |

## Shell

| File | Purpose |
|---|---|
| [`src/app/pages/shell/shell.ts`](../src/app/pages/shell/shell.ts) | Authenticated frame — header, nav, user menu, welcome banner, router outlet. Subscribes to router events for progress bar. |
| [`src/app/pages/shell/shell.html`](../src/app/pages/shell/shell.html) | Layout with skip link, header (logo, nav, theme toggle, avatar menu), welcome banner, main content area. |

## Home (placeholder)

| File | Purpose |
|---|---|
| [`src/app/pages/home/home.ts`](../src/app/pages/home/home.ts) | **Placeholder showcase** — displays feature list driven by `environment.features`. Replace with your app's landing content. |

## Specs and documentation

| File | Purpose |
|---|---|
| [`specs/done/account-team-management.md`](../specs/done/account-team-management.md) | Spec for account/team management feature — API coverage audit, information architecture |
| [`specs/done/ux-improvements.md`](../specs/done/ux-improvements.md) | UX improvement plan — 17 findings, all resolved. Covers accessibility, feedback, design language |
| [`TEST-CASES.md`](../TEST-CASES.md) | Manual testing checklist for all auth/team flows |
| [`PORTING.md`](../PORTING.md) | Framework-neutral behaviour spec for React/Vue ports |
| [`TEMPLATE_API.md`](../TEMPLATE_API.md) | Component surface documentation — what each template binds to |
