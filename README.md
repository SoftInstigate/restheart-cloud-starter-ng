# RESTHeart Cloud Starter — Angular

An Angular starter built on [`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng). Implements all RESTHeart Cloud auth and multi-tenancy flows out of the box — fork it, point it at your RESTHeart Cloud service, and start building your app.

Works for multi-tenant SaaS (invitations, team switcher) and simpler apps (auth only).

## What's included

- Signup, login, logout — email/password and Google/GitHub OAuth
- Email verification, password reset
- Team invitations — new user flow (`/auth/activate`) and existing user flow (`/invitations/accept`)
- Team switcher — shown only when the user belongs to more than one team
- Authenticated shell with placeholder for your app content
- SSR for public routes, CSR for the authenticated shell

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


### 3. Start

```bash
ng serve
```

## Structure

```
src/app/
  pages/
    auth/        ← login, signup, verify, activate, reset-password,
    │               forgot-password, accept-invite
    shell/       ← authenticated shell (replace with your content)
  app.routes.ts
  app.config.ts  ← provideRhAuth() configured here
```

## Customization

- **Style**: plain CSS, no framework. This is a starter, not an opinionated app — we don't want to lock you into a UI component library (Material, Spartan, PrimeNG...) or a utility-CSS framework (Tailwind, UnoCSS...). The auth pages use plain HTML and hand-written CSS with a small set of custom properties for theming (`src/styles.css`), so you can restyle freely or swap in your framework of choice without fighting existing markup or class conventions. `@restheart-cloud/kit-ng` itself ships no UI at all — just services, guards, and an interceptor — so the pages under `pages/auth/` are the only place styling choices live. Edit them directly under `pages/auth/`.
- **Shell**: replace `pages/shell/shell.component.ts` with your layout.
- **Routing**: add your routes inside the authenticated shell.

## Manual testing checklist

No automated E2E suite yet — these flows are verified by hand, typically after bumping
`@restheart-cloud/kit`/`@restheart-cloud/kit-ng` or touching anything under `pages/auth/` or
`pages/invitations/`. Use the browser's Network tab where noted — bearer mode should never make an
extra `POST /token` call after `activate`/`reset-password`/`switch-team`; the token comes back
directly in that same request's response.

### Signup & email verification

- [ ] Sign up with a new email/password → confirmation message shown, user not logged in yet
- [ ] Verification email arrives
- [ ] Clicking the verification link logs the user in automatically and lands in the app (welcome banner shown)
- [ ] Network tab: the verify redirect carries `#access_token=...` in the fragment, no extra `/token` call
- [ ] Signing up with an already-registered email shows "account already exists"
- [ ] A weak password is rejected

### Login / logout

- [ ] Login with correct credentials → redirected into the app
- [ ] Login with wrong password → "Invalid email or password"
- [ ] Logout clears the session and redirects to `/auth/login`
- [ ] Reloading the page after login keeps the session
- [ ] Staying idle past ~12 minutes (80% of the 15-minute token TTL) silently renews the session — check Network tab for `GET /token?renew`

### Forgot / reset password

- [ ] "Forgot password" shows the same confirmation for both existing and non-existing emails
- [ ] Reset link → setting a new password logs the user in automatically
- [ ] Network tab: `PATCH /auth/reset-password?delivery=body` returns `access_token` directly — no follow-up `POST /token`
- [ ] Old password stops working after reset; new password works

### Team invitations — new user (`/auth/activate`)

- [ ] Inviting a new email sends an invitation
- [ ] Invite link shows the "set password" form with the correct org name/role
- [ ] Setting the password activates the account and logs the user straight in
- [ ] Network tab: `PATCH /auth/activate?delivery=body` returns `access_token` directly — no follow-up `POST /token`
- [ ] An invalid/expired invite link shows the correct error

### Team invitations — existing user (`/invitations/accept`)

- [ ] Inviting an already-registered email sends an invite
- [ ] Accepting while logged out prompts login first, then accepts
- [ ] Accepting while already logged in works directly
- [ ] The new team shows up afterwards in the team switcher

### Team switcher

- [ ] Only visible for users with more than one team
- [ ] Switching teams updates the active team context immediately, no manual refresh needed
- [ ] Network tab: `POST /auth/switch-team?delivery=body` returns the new token directly and the session reflects the new team without a page reload

### OAuth (Google / GitHub)

- [ ] "Sign in with Google/GitHub" completes the provider consent flow and logs the user in
- [ ] A new user via OAuth gets an account + team created automatically
- [ ] OAuth from the invite-activation page accepts the invitation directly (no separate password step)
- [ ] OAuth from the existing-user accept-invite page accepts the invitation directly

### Session / guards

- [ ] Visiting the authenticated shell while logged out redirects to `/auth/login`
- [ ] Visiting `/auth/login` while already logged in redirects into the shell
- [ ] An expired/invalid token clears the session on the next API call instead of hanging or failing silently
- [ ] A hard refresh mid-session preserves the login (SSR renders public routes, CSR takes over the authenticated shell)

## Packages used

- [`@restheart-cloud/kit`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit) — TypeScript auth logic
- [`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng) — Angular adapter
