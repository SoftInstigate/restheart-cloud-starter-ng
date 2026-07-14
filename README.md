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

## Packages used

- [`@restheart-cloud/kit`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit) — TypeScript auth logic
- [`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng) — Angular adapter
