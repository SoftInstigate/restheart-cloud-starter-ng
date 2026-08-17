---
type: Architecture
title: Architecture Overview
description: Angular SSR architecture, dependency layers, routing/guards, auth flow, and fragment token handling for restheart-cloud-starter-ng.
tags: [architecture, angular, ssr, auth, routing]
resource: /src/app/app.config.ts
---

# Architecture Overview

## Layer model

The application has three distinct layers:

```
┌─────────────────────────────────────────────┐
│  Templates (HTML + page CSS)                │  ← Disposable skin layer
├─────────────────────────────────────────────┤
│  Component classes (Angular signals/forms)   │  ← Glue — framework-specific
├─────────────────────────────────────────────┤
│  @restheart-cloud/kit (plain TypeScript)     │  ← Portable — do not reimplement
└─────────────────────────────────────────────┘
```

- **Templates** — semantic HTML with class hooks (`.card`, `.btn-primary`, `.form-field`). The default CSS skin in `src/styles.css` is deliberately disposable; see [Operations](operations.md#css-theming) for restyling.
- **Components** — Angular signal-based state, reactive forms, `RhAuthService` injection. Framework-specific glue.
- **`@restheart-cloud/kit`** — plain TypeScript with a Promise-based API. Handles all HTTP calls, token storage, and session logic. **Do not reimplement auth logic, HTTP calls, or token handling** — depend on kit directly.

The `@restheart-cloud/kit-ng` package bridges kit and Angular: it provides `RhAuthService` (reactive state), `authGuard`/`publicGuard`, and an HTTP interceptor that attaches the bearer token and clears the session on 401/expiry.

## SSR / CSR split

```mermaid
flowchart TD
    A["Browser Request"] --> B{"Route Type?"}
    B -->|Auth pages| C["Prerender"]
    B -->|Authenticated routes| D["Client Render"]
    B -->|Other| E["Server Render"]
    
    C --> F["Static HTML from server"]
    D --> G["CSR in browser"]
    E --> H["SSR with AngularNodeAppEngine"]
    
    F --> I["Fast initial paint"]
    G --> J["Requires auth token"]
    H --> K["Server-side logic"]
    
    I --> L["Public auth pages"]
    J --> M["Protected app pages"]
    K --> N["API routes, other"]
```

The app uses Angular 21's hybrid SSR model. Routes declare their render mode in [`src/app/app.routes.server.ts`](../src/app/app.routes.server.ts):

| Render mode | Routes | Why |
|---|---|---|
| `Prerender` | `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password` | Static HTML — no live data needed |
| `Client` | `/auth/verify`, `/invitations/accept`, all authenticated routes (`/home`, `/teams/*`, `/account`) | Require live API calls or in-memory token |

The SSR entry point is [`src/server.ts`](../src/server.ts) — an Express 5 app that serves static files from `/browser` and delegates all other requests to `AngularNodeAppEngine`. The server listens on `PORT` or defaults to 4000.

**Key constraint:** authenticated routes cannot be server-rendered because the bearer token lives in an in-memory signal, not in a cookie. SSR renders the public auth pages; CSR takes over once the user is authenticated.

**Change navigation:** When modifying SSR/CSR behavior, check `src/app/app.routes.server.ts` for render mode assignments and `src/server.ts` for the Express server configuration. Test with `ng build && node dist/restheart-cloud-starter-ng/server/server.mjs` and verify auth pages are prerendered (view source shows HTML) while authenticated routes are client-rendered only.

## Bootstrap flow

```mermaid
sequenceDiagram
    participant Main as main.ts
    participant App as App Component
    participant Config as appConfig
    participant Auth as RhAuthService
    participant Router as Angular Router
    participant Guard as Auth Guard
    
    Main->>Config: bootstrapApplication with appConfig
    Config->>Auth: provideRhAuth apiBaseUrl
    Note over Auth: Configure HTTP interceptor and auth service
    
    App->>App: Check apiUrl validity
    alt apiUrl not valid restheart.com URL
        App->>App: Show Connect your service screen
    else apiUrl valid
        App->>App: consumeFragmentToken
        Note over App: Capture access_token from URL hash
        App->>Router: Initialize routing
        Router->>Guard: Run authGuard
        Guard->>Auth: checkSession
        Auth->>Auth: Load user and teams
        alt User authenticated
            Guard->>Router: Allow navigation
        else No user
            Guard->>Router: Redirect to auth login
        end
    end
```

1. [`src/main.ts`](../src/main.ts) bootstraps `App` with [`appConfig`](../src/app/app.config.ts)
2. `appConfig` calls `provideRhAuth({ apiBaseUrl })` — this configures the HTTP interceptor and auth service
3. If `apiUrl` is not a valid `*.restheart.com` URL, no routes are provided — the app shows the "Connect your service" screen
4. On browser load, [`App`](../src/app/app.ts) calls `consumeFragmentToken()` to capture any `#access_token=...` from the URL (returned by email verification or OAuth redirects)
5. Route guards run: `authGuard` calls `checkSession()` (which also loads teams), `publicGuard` redirects signed-in users away from auth pages

**Change navigation:** When modifying the bootstrap flow, start with `src/app/app.ts` for fragment token handling, then `src/app/app.config.ts` for provider configuration. Test with `ng serve` and verify the "Connect your service" screen appears for invalid URLs. For auth guard changes, check `src/app/app.routes.ts` and test with `ng test`.

## Routing and guards

Defined in [`src/app/app.routes.ts`](../src/app/app.routes.ts). Two guards from `@restheart-cloud/kit-ng`:

- **`authGuard`** — runs `checkSession()`; if no user, redirects to `/auth/login`. Also loads teams as a side effect.
- **`publicGuard`** — inverse: if user exists, redirects into the app.

`/invitations/accept` is deliberately **unguarded** — it must work for signed-out invitees, signed-in users, and people without an account.

Routes are conditionally included based on feature flags from `environment.features`. A flag that's off removes the route entirely.

Per-route titles use a custom `AppTitleStrategy` that appends `· RESTHeart Cloud Starter` to every title. See [Domain Concepts](domain-concepts.md#feature-flags) for the flag model.

## Auth state model

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticated : checkSession or login
    Authenticated --> Unauthenticated : logout or token expired
    
    state Authenticated {
        [*] --> UserLoaded
        UserLoaded --> TeamsLoaded : loadTeams
        TeamsLoaded --> TeamSwitched : switchTeam
        TeamSwitched --> UserLoaded : new JWT
    }
    
    state Unauthenticated {
        [*] --> NoToken
        NoToken --> HasToken : setToken
        HasToken --> NoToken : clearSession
    }
```

`RhAuthService` exposes reactive signals:

| Signal | Type | Notes |
|---|---|---|
| `user()` | `UserInfo \| null` | `user._id` is the email. Profile at `user.profile.name`/`.surname` |
| `teams()` | `TeamMembership[]` | Each has `id.$oid`, `name`, `description`, `role`, `active` |
| `isAuthenticated()` | `boolean` | Derived from `user` |

**Critical behavior:**
- `checkSession()` also loads teams. It short-circuits to `null` with empty teams when there's no stored token (no HTTP call), otherwise fetches user then teams.
- `login()` also loads teams in the same round trip.
- `loadTeams()` explicitly refreshes teams and updates the `teams()` signal. Returns an Observable that emits the teams array. Used by `Teams` and `TeamDetail` components for manual refresh (e.g., after team deletion).
- `switchTeam()` reissues the JWT with a new active team — no page reload needed.

Get these wrong and team-dependent UI is intermittently empty.

**Change navigation:** When modifying auth state behavior, start with `@restheart-cloud/kit-ng` package for `RhAuthService` implementation. Test with `ng test` and verify team-dependent UI works correctly. For token lifecycle changes, check `src/app/app.ts` for fragment token handling and test with manual flows from TEST-CASES.md.

## Fragment token capture

```mermaid
sequenceDiagram
    participant Backend as RESTHeart Backend
    participant Browser as Browser
    participant App as App Component
    participant Auth as RhAuthService
    
    Backend->>Browser: 302 Redirect with access_token
    Browser->>App: Page load with URL hash
    App->>App: Parse window.location.hash
    App->>Auth: setToken access_token
    App->>Auth: scheduleRefresh
    App->>App: Read flow signup query param
    alt flow signup present
        App->>App: Set justSignedUp signal one-shot
    end
    App->>App: history replaceState to clear URL
    Note over App: Token captured URL cleaned
```

After email verification and after OAuth, the backend 302-redirects with the token in the URL fragment:

```
https://your-app/#access_token=…&token_type=Bearer&expires_in=900
```

`consumeFragmentToken()` in [`src/app/app.ts`](../src/app/app.ts):
1. Reads `#access_token=...` from the hash → calls `setToken()` + `scheduleRefresh()`
2. Reads `?flow=signup` query param → sets the `justSignedUp` signal (one-shot, for welcome banner)
3. Clears both from the URL bar via `history.replaceState()`

This runs once on browser load, before route guards execute.

**Change navigation:** When modifying fragment token handling, edit `src/app/app.ts` and test with email verification and OAuth flows. Verify the welcome banner appears only for fresh signups (not subsequent logins) and that the URL is cleaned properly. Use browser DevTools Network tab to check for extra `POST /token` calls.

## Token lifecycle

- Bearer token has a **15-minute TTL**
- `scheduleRefresh()` from kit silently renews at ~80% (~12 minutes)
- The HTTP interceptor attaches the token to all API calls
- On 401/expiry, the interceptor clears the session

## Page title strategy

[`AppTitleStrategy`](../src/app/app.routes.ts) in `app.routes.ts` extends Angular's `TitleStrategy`. Each route declares a `title` property; the strategy prepends it with `· RESTHeart Cloud Starter`.

## Navigation progress

The `Shell` component subscribes to router events and sets a `navigating` signal between `NavigationStart` and `NavigationEnd`/`Cancel`/`Error`. This drives a thin progress bar at the top of the page during lazy route loading.

## Change navigation

When making changes to the architecture, follow this guidance:

### For routing and guard changes
- **Start with:** `src/app/app.routes.ts` for route definitions and guards
- **Check:** `src/app/app.routes.server.ts` for SSR render mode assignments
- **Test with:** `ng test` and manual testing of route navigation
- **Important symbols:** `authGuard`, `publicGuard`, `AppTitleStrategy`

### For SSR/CSR changes
- **Start with:** `src/app/app.routes.server.ts` for render mode assignments
- **Check:** `src/server.ts` for Express server configuration
- **Test with:** `ng build && node dist/restheart-cloud-starter-ng/server/server.mjs`
- **Validation:** Auth pages should be prerendered (view source shows HTML), authenticated routes client-rendered only

### For auth state changes
- **Start with:** `@restheart-cloud/kit-ng` package for `RhAuthService` implementation
- **Check:** `src/app/app.ts` for fragment token handling
- **Test with:** Manual flows from TEST-CASES.md
- **Important signals:** `user()`, `teams()`, `isAuthenticated()`

### For bootstrap changes
- **Start with:** `src/app/app.ts` for fragment token handling
- **Check:** `src/app/app.config.ts` for provider configuration
- **Test with:** `ng serve` and verify "Connect your service" screen appears for invalid URLs
- **Validation:** `ng build` succeeds, SSR server starts without errors
