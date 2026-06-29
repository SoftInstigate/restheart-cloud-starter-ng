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

1. **A RESTHeart Cloud service** — [create one at restheart.org/cloud](https://restheart.org/cloud). Use a **free** service for development, a **shared** service for production.
2. Angular CLI (`npm install -g @angular/cli`)

## Setup

### 1. Fork and clone

```bash
git clone https://github.com/your-org/restheart-cloud-starter-ng.git
cd restheart-cloud-starter-ng
npm install
```

### 2. Point to your RESTHeart Cloud service

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'https://your-service.restheart.cloud',
};
```

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

- **Style**: UnoCSS (Tailwind preset). Edit pages under `pages/auth/`.
- **Shell**: replace `pages/shell/shell.component.ts` with your layout.
- **Routing**: add your routes inside the authenticated shell.

## Packages used

- [`@restheart-cloud/kit`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit) — TypeScript auth logic
- [`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng) — Angular adapter
