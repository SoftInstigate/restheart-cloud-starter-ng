---
type: Integration
title: Integrations & Dependencies
description: "restheart-cloud/kit, kit-ng, RESTHeart Cloud service, OAuth providers, and OpenWiki CI integration."
tags: [integrations, kit, restheart-cloud, oauth, ci]
resource: /package.json
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
- **`provideRhAuth({ apiBaseUrl })`** — Angular provider function configured in `app.config.ts`

**Configuration** in [`src/app/app.config.ts`](../src/app/app.config.ts):

```typescript
provideRhAuth({ apiBaseUrl: environment.apiUrl })
```

**Version:** currently `^0.7.0` (see `package.json`).

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

**OAuth flow:** browser redirect → provider consent → backend redirect with `#access_token=...` → fragment token capture in `App`.

## OpenWiki CI

The repository has an OpenWiki GitHub Actions workflow at [`.github/workflows/openwiki-update.yml`](../.github/workflows/openwiki-update.yml):

- **Schedule:** every 3 days at 04:29 UTC (`29 4 */3 * *`)
- **Trigger:** also manual via `workflow_dispatch`
- **Action:** runs `openwiki code --update --print`, creates a PR with documentation updates
- **Model:** `xiaomi/mimo-v2.5-pro` via OpenRouter
- **Tracing:** disabled

The workflow commits to branch `openwiki/update` and creates a PR via `peter-evans/create-pull-request`.

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

### For CI/CD changes
- **Start with:** `.github/workflows/openwiki-update.yml` for OpenWiki workflow
- **Check:** Workflow schedule and model configuration
- **Test with:** Manual workflow dispatch
- **Validation:** PR is created with documentation updates
