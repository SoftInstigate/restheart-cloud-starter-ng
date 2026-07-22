---
type: Domain Concepts
title: Domain Concepts
description: RESTHeart Cloud auth model, teams, invitations, tokens, feature flags, and the SSR/CSR split.
tags: [domain, auth, teams, tokens, feature-flags]
resource: /src/environments/environment.ts
---

# Domain Concepts

## RESTHeart Cloud auth model

The starter is a frontend for [RESTHeart Cloud](https://cloud.restheart.com), a hosted backend service. The auth model:

- **Users** are identified by email (`user._id` is the email address)
- **Profile** data lives at `user.profile.name` / `user.profile.surname`
- **Teams** are multi-tenant containers. Each user belongs to one or more teams.
- **Roles** per team: `owner` or `member`. Owners can invite, remove, and manage team settings.
- **Active team** — the JWT contains a `team` claim (`{ _id, role }`). `switchTeam()` reissues the JWT with a different active team.

## Authentication flow

RESTHeart Cloud uses **bearer token authentication**:

1. Token is obtained via `POST /token` (login) or returned directly by activate/reset-password/switch-team endpoints (`?delivery=body`)
2. Token has a **15-minute TTL**
3. `scheduleRefresh()` silently renews at ~80% (~12 minutes) via `GET /token?renew`
4. The HTTP interceptor from `kit-ng` attaches the token to all API calls
5. On 401/expiry, the interceptor clears the session — next `checkSession()` returns null

**Bearer mode:** the starter uses bearer tokens (not cookies). This means:
- Token lives in localStorage (via kit)
- SSR cannot access the token — authenticated routes must be client-rendered
- Token is passed in the `Authorization: Bearer ...` header

## Teams

A team has:
- `id.$oid` — MongoDB ObjectId
- `name` — human-readable name
- `description` — optional
- `role` — the current user's role (`owner` | `member`)
- `active` — whether this is the user's currently active team

**Team creation:** when a user signs up, a team is auto-created with `"{firstName}'s Team"` as the name. Additional teams can be created via `POST /auth/teams`.

**Team deletion:** only possible when no other members remain. Backend enforces with an atomic `findOneAndDelete` + `$expr` size guard — returns 409 if other members exist.

## Invitations

The invitation flow has three paths through a single page (`/invitations/accept`):

| Scenario | `isNewUser` | Auth state | Action |
|---|---|---|---|
| New user | `true` | Not logged in | Set password → `activate` |
| Existing user, logged out | `false` | Not logged in | Login → `acceptInvite` |
| Existing user, logged in | `false` | Logged in | `acceptInvite` directly |

Invitations carry `email` + `token` as query params. The token is validated by `getInvitation()`.

**Resend cooldown:** 5 minutes. Implemented with a reactive `now` signal ticking every 30s to keep the countdown accurate in zoneless Angular.

## Feature flags

Defined in `src/environments/environment*.ts`:

```typescript
features: {
  emailRegistration: boolean,  // Registration & Verification
  passwordReset: boolean,      // Password Reset
  oauthLogin: boolean,         // OAuth Social Login
  oauthProviders: string[],    // e.g. ['google', 'github']
  teamInvitations: boolean,    // Team Invitations
}
```

**How they work:**
1. Routes are conditionally included in `app.routes.ts` based on flags
2. UI elements (links, buttons) check flags to decide visibility
3. A flag that's off removes both the route AND the UI that links to it
4. Flags must match your RESTHeart Cloud service's **Sign-up Mgmt → Features** toggles — a mismatch causes 403 errors

**Default configs:**
- `environment.ts` (production): all on except `oauthLogin`
- `environment.dev.ts` (development): all on including `oauthLogin` with Google

## SSR / CSR boundary

The render boundary is the authentication state:

| Zone | Render mode | Why |
|---|---|---|
| Auth pages (login, signup, verify, forgot/reset password) | Prerender or Client | Static forms can be prerendered; verify/invitations need live API |
| Authenticated shell + inner pages | Client only | Token is in-memory signal, not available during SSR |

This means:
- Auth pages have fast initial paint (prerendered HTML)
- The authenticated shell renders only after CSR hydration
- There's a brief flash between SSR and CSR for auth pages (the prerendered HTML is replaced by client-rendered HTML)

## Welcome banner

The `justSignedUp` signal (in [`just-signed-up.ts`](../src/app/just-signed-up.ts)) is:
- Set to `true` by `App.consumeFragmentToken()` when `?flow=signup` is in the URL
- Read once by `Shell` to show the welcome banner
- Reset to `false` by `Shell`'s constructor
- Never persisted — can't reappear on later logins

**Critical:** the banner copy says "your account is ready" — it must NOT claim "email verified" because OAuth signups also trigger it (no email verification happened).

## Design token system

`src/styles.css` section 1 defines CSS custom properties:
- **Colour:** `--color-bg`, `--color-surface`, `--color-primary` (RESTHeart amber), `--color-link` (teal), `--color-error`
- **Typography:** `--font-family` (system-ui), `--font-mono` (for chrome labels), scale from `--text-xs` to `--text-2xl`
- **Space:** `--space-1` through `--space-8`
- **Shape:** `--radius-sm`, `--radius`, `--radius-lg`, `--border-width`

Dark mode overrides these tokens under `html.dark`. The `ThemeService` toggles the `.dark` class on `<html>` and persists to `localStorage['rh-theme']`.
