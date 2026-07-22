---
type: Quickstart
title: RESTHeart Cloud Starter — Angular
description: Concise entrypoint for the restheart-cloud-starter-ng repository. Covers what the project is, how to set it up, and where to go next.
tags: [quickstart, angular, restheart-cloud, starter]
resource: /README.md
---

# RESTHeart Cloud Starter — Angular

An Angular 21 starter application built on [`@restheart-cloud/kit-ng`](https://github.com/SoftInstigate/restheart-cloud-kit/tree/main/packages/kit-ng). It implements all RESTHeart Cloud authentication and multi-tenancy flows out of the box — fork it, point it at your RESTHeart Cloud service, and start building.

Works for multi-tenant SaaS (invitations, team switcher) and simpler apps (auth only).

## What's included

- **Signup, login, logout** — email/password and Google/GitHub OAuth
- **Email verification, password reset**
- **Team invitations** — one page (`/invitations/accept`) branching into new-user "set password" or existing-user "log in and accept"
- **Team switcher** — shown only when the user belongs to more than one team
- **Authenticated shell** with placeholder for your app content
- **SSR for public routes**, CSR for the authenticated shell
- **Account management** — profile editing and password change
- **Dark/light mode** — persisted to localStorage

## Quick setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/restheart-cloud-starter-ng.git
cd restheart-cloud-starter-ng
npm install

# 2. Point to your RESTHeart Cloud service
# Edit src/environments/environment.dev.ts — set apiUrl to your service URL
# Then tell git to ignore local changes:
git update-index --assume-unchanged src/environments/environment.dev.ts

# 3. Start
ng serve
```

**Prerequisites:** A RESTHeart Cloud service ([create one at cloud.restheart.com](https://cloud.restheart.com)) and Angular CLI.

## How it works

The app detects whether `apiUrl` points to a valid `*.restheart.com` service. If not, it shows a "Connect your service" screen instead of the full app. Once configured, the route guard system drives everything:

- **`authGuard`** protects authenticated routes — redirects to `/auth/login` if no session
- **`publicGuard`** protects auth pages — redirects into the app if already signed in
- **`/invitations/accept`** is deliberately unguarded — works for signed-out invitees, signed-in users, and new accounts

Feature flags in `src/environments/environment*.ts` must match your service's **Sign-up Mgmt → Features** toggles. A flag that's off removes both the route and the UI that links to it.

## Documentation map

| Page | What it covers |
|---|---|
| [Architecture](architecture.md) | Angular SSR setup, dependency layers, routing, guards, auth flow |
| [Source Map](source-map.md) | File-by-file guide organized by domain |
| [Workflows](workflows.md) | Key user flows: signup, login, OAuth, invitations, team management |
| [Domain Concepts](domain-concepts.md) | RESTHeart Cloud auth model, teams, tokens, feature flags |
| [Operations](operations.md) | Build, serve, SSR deploy, environment config, CSS theming, porting |
| [Testing](testing.md) | Manual test checklist, what to test when changing what |
| [Integrations](integrations.md) | @restheart-cloud/kit, kit-ng, RESTHeart Cloud service, OAuth, CI |

## Existing documentation

| File | Purpose |
|---|---|
| [`README.md`](../README.md) | Setup, structure, swap map, documentation map |
| [`TEMPLATE_API.md`](../TEMPLATE_API.md) | What each template binds to: signals, methods, inputs, form controls |
| [`PORTING.md`](../PORTING.md) | Framework-neutral behaviour spec for React/Vue ports |
| [`TEST-CASES.md`](../TEST-CASES.md) | Manual testing checklist for all auth/team flows |
| [`specs/done/`](../specs/done/) | Completed specs: UX improvements, account/team management |

## Key dependencies

| Package | Role |
|---|---|
| `@restheart-cloud/kit` | TypeScript auth logic — plain Promise-based API, no framework coupling |
| `@restheart-cloud/kit-ng` | Angular adapter — reactive wrapper (`RhAuthService`), guards, HTTP interceptor |
| `@angular/core` ^21.2 | Angular framework |
| `@angular/ssr` ^21.2 | Server-side rendering |
| `express` ^5.1 | SSR server |

## Where to start

1. **Just exploring?** Read this page, then [Architecture](architecture.md) for the big picture.
2. **Building a feature?** Check [Workflows](workflows.md) for existing flows, then [Source Map](source-map.md) for where to look.
3. **Porting to React/Vue?** Read [`PORTING.md`](../PORTING.md) first — it covers what's portable and what you must rebuild.
4. **Restyling?** The [swap map in README.md](../README.md#swap-map) maps every semantic class hook to framework equivalents. [`TEMPLATE_API.md`](../TEMPLATE_API.md) documents what each template binds to.
5. **Running tests?** See [Testing](testing.md) for the manual checklist and automated test status.

## Backlog

- **Automated E2E tests** — Currently manual only (TEST-CASES.md). No Cypress/Playwright suite exists.
- **Team list refresh after create** — `auth.createTeam()` doesn't update `auth.teams()` yet (restheart#643).
- **SSR-safe ThemeService** — ThemeService touches `localStorage`/`document` without platform guard; safe today because only Shell injects it, but would break if injected into a prerendered page.
