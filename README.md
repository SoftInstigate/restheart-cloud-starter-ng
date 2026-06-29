# RESTHeart Cloud Starter — Angular

An Angular starter built on [`@restheart-cloud/kit-ng`](../restheart-cloud-kit/packages/kit-ng). Implements all RESTHeart Cloud auth and multi-tenancy flows out of the box — fork it, set your backend URL, and start building your app.

Works for multi-tenant SaaS (invitations, team switcher) and simpler apps (auth only).

## What's included

- Signup, login, logout — email/password and Google/GitHub OAuth
- Email verification, password reset
- Team invitations — new user flow (`/auth/activate`) and existing user flow (`/invitations/accept`)
- Team switcher — shown only when the user belongs to more than one team
- Authenticated shell with placeholder for your app content
- SSR for public routes, CSR for the authenticated shell

## Setup

### 1. Prerequisites

- Node.js 20+
- RESTHeart Cloud (or self-hosted RESTHeart 9.4+ with `restheart-accounts`)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'http://localhost:8080',
};
```

### 4. Start

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

- **Style**: UnoCSS (Tailwind preset). Edit pages under `pages/auth/`.
- **Shell**: replace `pages/shell/shell.component.ts` with your layout.
- **Routing**: add your routes inside the authenticated shell.
- **Backend**: set `environment.apiUrl` and adjust `app.config.ts`.

## Packages used

- [`@restheart-cloud/kit`](../restheart-cloud-kit/packages/kit) — TypeScript auth logic
- [`@restheart-cloud/kit-ng`](../restheart-cloud-kit/packages/kit-ng) — Angular adapter
