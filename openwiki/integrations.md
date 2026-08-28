---
type: Integration
title: Integrations & Dependencies
description: "restheart-cloud/kit, kit-ng, RESTHeart Cloud service, OAuth providers, the rhc CLI tool, and OpenWiki CI integration."
tags: [integrations, kit, restheart-cloud, oauth, ci, cli]
verified:
  - by: openwiki/0.4.3
    at: 2026-08-28T16:45:54.291Z
sources:
  - id: openwiki-source-6d4b4e707b8d60b6ccfa3425
    resource: repo://.github/workflows/openwiki-update.yml
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-cec027055a927c253ba22cff
    resource: repo://rhc.setup.consents.ts
  - id: openwiki-source-61cc9cbff8e3e2bb34c724a6
    resource: repo://rhc.setup.ts
  - id: openwiki-source-d0cca70daf23ae76d9eafbb8
    resource: repo://specs/done/account-team-management.md
  - id: openwiki-source-1b6b17b8afa47babcf26380f
    resource: repo://src/app/app.config.ts
  - id: openwiki-source-407c70ba325b6f9e6aa4707e
    resource: repo://src/app/app.routes.ts
  - id: openwiki-source-533e7761316e2fac327194b8
    resource: repo://src/app/app.ts
  - id: openwiki-source-76b992238575041d25a8d7ba
    resource: repo://src/app/consents-gate.ts
  - id: openwiki-source-3629f9e95f35cf558c779f38
    resource: repo://src/app/consents.ts
  - id: openwiki-source-70c667e2c44ccbc805a4be66
    resource: repo://src/app/oauth-url.ts
  - id: openwiki-source-136a04e418a9969c28b1c30f
    resource: repo://src/app/pages/auth/login/login.ts
  - id: openwiki-source-1153b336967cba65b87d1df6
    resource: repo://src/app/pages/auth/oauth-buttons/oauth-buttons.ts
  - id: openwiki-source-cc2a121090704e17ef477a1b
    resource: repo://src/app/pages/auth/signup/signup.ts
  - id: openwiki-source-be9f7de43e6b35b73dbb2aae
    resource: repo://src/app/pages/home/home.ts
  - id: openwiki-source-9fd5be7b4a86f1a62c53cab3
    resource: repo://src/app/pages/shell/shell.ts
  - id: openwiki-source-8d236ec39d0e441a38b5d676
    resource: repo://src/environments/environment.dev.ts
  - id: openwiki-source-eaae96b81373abab97667f4f
    resource: repo://src/environments/environment.ts
generated: { by: "openwiki/0.4.3", at: "2026-08-28T16:45:54.291Z" }
---

# Integrations & Dependencies

## @restheart-cloud/kit

[`@restheart-cloud/kit`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit) is the core TypeScript library. It provides:

- **Auth functions:** `register`, `verify`, `login`, `logout`, `checkSession`, `forgotPassword`, `resetPassword`
- **Team functions:** `loadTeams`, `switchTeam`, `listTeamMembers`, `createTeam`, `updateTeam`, `deleteTeam`
- **Invitation functions:** `invite`, `resendInvite`, `getInvitation`, `activate`, `acceptInvite`, `listInvitations`
- **Member functions:** `removeMember`, `updateMemberRole`
- **Profile functions:** `updateProfile`, `changePassword`
- **Token management:** `setToken`, `getToken`, `scheduleRefresh`, `clearSession`

**Key properties:**
- Plain TypeScript, Promise-based API, no framework coupling
- Handles all HTTP calls, token storage (localStorage), and session logic
- 100% portable across frameworks — React/Vue ports should depend on it directly

## @restheart-cloud/kit-ng

[`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng) is the Angular adapter. It provides:

- **`RhAuthService`** — injectable service wrapping kit functions as Observables. Exposes reactive signals: `user()`, `teams()`, `isAuthenticated()`.
- **`authGuard`** / **`publicGuard`** — route guards that call `checkSession()`
- **HTTP interceptor** — attaches bearer token to all API calls, clears session on 401/expiry
- **`provideRhAuth({ apiBaseUrl, onError? })`** — Angular provider function configured in `app.config.ts`
- **`isValidApiBaseUrl(url)`** — validates that a URL points to a RESTHeart Cloud service; used to guard route registration and show a configuration screen when unset
- **`setToken`**, **`scheduleRefresh`** — standalone functions for manual token management (used for fragment token capture after OAuth/email verification redirects)
- **`acceptConsents()`** — method on `RhAuthService` for the consents gate pattern

**Configuration** in [`src/app/app.config.ts`](../src/app/app.config.ts):

```typescript
provideRhAuth({ apiBaseUrl: environment.apiUrl, onError: consentsOnError })
```

The `onError` callback receives every failure the kit encounters, including session restoration errors that no caller is waiting on. The starter uses this to detect `451` responses from the consents gate (see [`src/app/consents.ts`](../src/app/consents.ts)).

**Version:** currently `^0.9.0` (see [`package.json`](../package.json)).

**`auth.api()` method:** provides an authenticated `fetch` wrapper that attaches the bearer token and handles errors. Returns an `Observable<Response>`. Use it for custom API calls to your RESTHeart Cloud service:

```typescript
this.auth.api('/demo').pipe(
  switchMap(res => res.json()),
  map(json => Array.isArray(json) ? json : []),
).subscribe(data => this.items.set(data));
```

**Key features of `auth.api()`:**
- Automatically attaches the bearer token to the request
- Handles authentication errors (401/expiry) by clearing the session
- Returns an `Observable<Response>` for reactive programming
- Simpler than using `HttpClient` directly for authenticated calls
- The home page includes a working demo of this pattern (see [`src/app/pages/home/home.ts`](../src/app/pages/home/home.ts))

**When to use `auth.api()` vs `HttpClient`:**
- Use `auth.api()` for simple authenticated calls to your RESTHeart Cloud service
- Use `HttpClient` when you need more control over headers, interceptors, or request configuration
- Both approaches work — `auth.api()` is recommended for most cases

## RESTHeart Cloud service

The starter is a frontend for [RESTHeart Cloud](https://cloud.restheart.com) services. Each service provides:

- **Auth endpoints** — `/auth/*` (register, verify, login, invite, etc.)
- **Token endpoint** — `/token` (login, renew)
- **User endpoint** — `/users/me` (session check)
- **Team endpoints** — `/auth/teams`, `/auth/team/*`, `/auth/team/members`

**Service tiers:**
- **Free** — for development only
- **Shared** (or higher) — for production

**API base URL format:** `https://<srvid>.<region>-<tier>.restheart.com`

## OAuth providers

OAuth is configured server-side in your RESTHeart Cloud service. The starter supports:

- **Google** — `oauthUrl('google')` → `{apiUrl}/auth/oauth/authorize/google?noauthchallenge`
- **GitHub** — `oauthUrl('github')` → `{apiUrl}/auth/oauth/authorize/github?noauthchallenge`

The `oauthProviders` array in `environment.features` must match what's configured server-side. The `OauthButtons` component renders a button per provider.

**OAuth flow:** browser redirect → provider consent → backend redirect with `#access_token=...` → fragment token capture in `App` via `consumeFragmentToken()` (see [`src/app/app.ts`](../src/app/app.ts)).

The `noauthchallenge` query parameter tells the RESTHeart Cloud service not to challenge for credentials before redirecting to the OAuth provider.

## @restheart-cloud/cli

[`@restheart-cloud/cli`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/cli) is a dev dependency (`^0.9.0`) that provisions a RESTHeart Cloud service to match what the starter expects.

**Workflow:**

```bash
npm i -D @restheart-cloud/cli
rhc login
rhc setup --srv <srvId> --dry-run    # what is missing
rhc setup --srv <srvId>              # make it so
```

**Setup file pattern:** The starter ships two setup files:

- [`rhc.setup.ts`](../rhc.setup.ts) — configures the accounts plugin: feature flags, OAuth credentials, CORS origin allowlist. Imports `environment.dev.ts` so feature flags are stated once — the same values drive both the app and the server configuration.
- [`rhc.setup.consents.ts`](../rhc.setup.consents.ts) — extends the accounts setup with the consents gate (user schema, guard rule, permission). Run with `--file rhc.setup.consents.ts`.

Each setup file exports a `defineSetup(...)` call containing an array of `step(...)` objects. Each step has a `check` (is the service already in the desired state?) and an `apply` (make it so). Running against an already-configured service writes nothing; `--dry-run` runs the checks only.

**Key imports from `@restheart-cloud/cli`:**
- `defineSetup`, `step` — setup file DSL
- `fromEnv` — resolves a secret from environment variables at apply time
- `isRedacted` — detects whether a stored secret reads back as bullets
- `isApiError` — type guard for API error responses (used to treat `409 Plugin already installed` as success)
- `AdminClient`, `PluginConfig` — types for the admin API

**What the setup configures:**
1. Accounts plugin installation and feature flag alignment
2. OAuth provider credentials (Google, GitHub) — only when the app's feature flags say so
3. CORS origin allowlist — ensures the app origin may call the service
4. (With `rhc.setup.consents.ts`) User document schema, guard rule, and consents permission

## OpenWiki CI

The repository has an OpenWiki GitHub Actions workflow at [`.github/workflows/openwiki-update.yml`](../.github/workflows/openwiki-update.yml):

- **Schedule:** every 3 days at 04:29 UTC (`29 4 */3 * *`)
- **Trigger:** also manual via `workflow_dispatch`
- **Action:** runs `openwiki code --update --print`, creates a PR with documentation updates
- **Model:** `xiaomi/mimo-v2.5-pro` via OpenRouter
- **Tracing:** disabled

The workflow commits to branch `openwiki/update` and creates a PR via `peter-evans/create-pull-request`. It updates paths under `openwiki/`, `AGENTS.md`, and `CLAUDE.md`.

## Angular ecosystem

| Package | Version | Role |
|---|---|---|
| `@angular/core` | ^21.2.0 | Framework |
| `@angular/ssr` | ^21.2.7 | Server-side rendering |
| `@angular/router` | ^21.2.0 | Client-side routing |
| `@angular/forms` | ^21.2.0 | Reactive forms |
| `@angular/platform-server` | ^21.2.0 | Server platform |
| `express` | ^5.1.0 | SSR server |
| `rxjs` | ~7.8.0 | Reactive extensions |
| `typescript` | ~5.9.2 | Language |

## Dev dependencies

| Package | Version | Role |
|---|---|---|
| `@angular/build` | ^21.2.7 | Build system |
| `@angular/cli` | ^21.2.7 | CLI tools |
| `@restheart-cloud/cli` | ^0.9.0 | Service provisioning (`rhc setup`) |
| `vitest` | ^4.0.8 | Test runner |
| `jsdom` | ^28.0.0 | DOM implementation for tests |
| `prettier` | ^3.8.1 | Code formatting |

## Adding new API endpoints

When RESTHeart Cloud adds new endpoints:

1. **Kit** — add a wrapper function in `@restheart-cloud/kit`
2. **Kit-ng** — add a method to `RhAuthService` in `@restheart-cloud/kit-ng`
3. **Starter** — wire the new method into the appropriate component

See [`specs/done/account-team-management.md`](../specs/done/account-team-management.md) for an example of this process (9 new endpoints added for restheart 9.6.0).

## Change navigation for integrations

### For @restheart-cloud/kit changes
- **Start with:** `@restheart-cloud/kit` package for TypeScript auth logic
- **Check:** `@restheart-cloud/kit-ng` for Angular adapter updates
- **Test with:** Manual API testing and `ng test`
- **Validation:** New functions follow Promise-based API pattern

### For @restheart-cloud/kit-ng changes
- **Start with:** `@restheart-cloud/kit-ng` package for Angular adapter
- **Check:** `src/app/app.config.ts` for provider configuration
- **Test with:** `ng test` and manual flows from TEST-CASES.md
- **Validation:** `RhAuthService` exposes new methods as Observables

### For OAuth provider changes
- **Start with:** `src/app/pages/auth/oauth-buttons/oauth-buttons.ts` for button rendering
- **Check:** `src/app/oauth-url.ts` for URL construction
- **Test with:** Manual OAuth flows from TEST-CASES.md
- **Validation:** OAuth buttons appear only when `oauthLogin` flag is enabled

### For rhc CLI / setup file changes
- **Start with:** `rhc.setup.ts` for accounts configuration
- **Check:** `rhc.setup.consents.ts` for consents gate extension
- **Test with:** `rhc setup --srv <srvId> --dry-run` to verify checks
- **Validation:** `--dry-run` reports all steps satisfied on a configured service

### For CI/CD changes
- **Start with:** `.github/workflows/openwiki-update.yml` for OpenWiki workflow
- **Check:** Workflow schedule and model configuration
- **Test with:** Manual workflow dispatch
- **Validation:** PR is created with documentation updates
