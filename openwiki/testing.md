---
type: Testing
title: Testing Guidance
description: Manual test checklist, automated test status, and what to test when changing key areas of restheart-cloud-starter-ng.
tags: [testing, qa, manual, checklist]
resource: /TEST-CASES.md
---

# Testing Guidance

## Current test status

**No automated E2E suite exists.** All flows are verified by hand using the checklist in [`TEST-CASES.md`](../TEST-CASES.md).

**Unit tests:** minimal — `app.spec.ts` and `oauth-buttons.spec.ts` only verify component creation. No behavioral tests.

**Test runner:** Vitest (configured in `package.json`), run via `ng test`.

## Manual testing checklist

The full checklist is in [`TEST-CASES.md`](../TEST-CASES.md). Key sections:

| Section | What to verify |
|---|---|
| Signup & email verification | Registration flow, verification link, token in fragment, duplicate email error |
| Login / logout | Credentials, wrong password, session persistence, token refresh |
| Forgot / reset password | Email enumeration prevention, auto-login after reset |
| Team invitations — new user | Invite link, set password, activate, auto-login |
| Team invitations — existing user | Logged out → login → accept; logged in → accept directly |
| Team switcher | Visibility (only when >1 team), immediate context update |
| OAuth | Provider consent, auto account creation, invite acceptance via OAuth |
| Session / guards | Auth guard redirect, public guard redirect, expired token handling, SSR/CSR transition |

## What to test when changing what

### Auth pages (`pages/auth/*`)
- All signup, login, verification, and password reset flows
- OAuth button rendering and URL construction
- Form validation (required fields, email format, password length)
- Error message display for each HTTP status code
- Network tab: verify no extra `POST /token` after activate/reset-password (bearer mode returns token directly)

### Invitation flow (`pages/invitations/*`)
- Three-way branching: new user, existing logged-out, existing logged-in
- Missing/invalid/expired token handling
- OAuth from invitation page

### Team management (`pages/teams/*`)
- Members list loading and empty states
- Role change and remove (owner only)
- Invite form and pending invitations
- Resend cooldown timer (5 minutes)
- Team settings save
- Team delete (only when no other members — 409 otherwise)

### Account (`pages/account/*`)
- Profile load and save
- Password change (with and without current password for OAuth users)
- OAuth user hint display

### Shell (`pages/shell/*`)
- Navigation links and active state
- User menu (avatar, dropdown, keyboard nav, Escape to close)
- Welcome banner (appears after signup, not on subsequent logins)
- Theme toggle (dark/light, persisted)
- Progress bar during lazy route loading

### Routing and guards
- Auth guard: unauthenticated → redirect to login
- Public guard: authenticated → redirect into app
- Feature flag gating: disabled flag removes route and UI link
- Per-route titles in browser tab

### SSR
- Auth pages prerender correctly (view source shows HTML)
- Authenticated routes are client-rendered only
- No SSR errors from browser APIs (localStorage, document)

## Browser DevTools checks

Use the **Network tab** to verify bearer mode behavior:

- After email verification: redirect carries `#access_token=...` in fragment, no extra `POST /token`
- After password reset: `PATCH /auth/reset-password?delivery=body` returns token directly
- After team switch: `POST /auth/switch-team?delivery=body` returns new token directly
- Token refresh: `GET /token?renew` at ~80% of TTL (~12 minutes)
- No redundant `POST /token` calls after any flow that returns a token directly

## Automated test gaps

Priority areas for future E2E tests:

1. **Auth flows** — signup → verification → login → logout cycle
2. **Invitation flows** — all three branches (new user, logged out, logged in)
3. **Team management** — invite → accept → role change → remove
4. **Token lifecycle** — refresh, expiry, session restoration
5. **Feature flag gating** — verify routes/UI appear/disappear correctly
6. **SSR/CSR boundary** — prerendered pages render, authenticated pages don't break during hydration
