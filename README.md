# RESTHeart Cloud Starter — Angular

An Angular app with sign-up, login, Google and GitHub sign-in, email verification, password reset,
teams and invitations — working, not sketched. Clone it, point it at a free service, and you have
the boring half of an application already done.

It is an Angular app plus a [RESTHeart Cloud](https://cloud.restheart.com) service. There is no
server of yours to write, deploy or pay for.

![RESTHeart Cloud Starter Home Page](./starter-home-page.png)

## Get it running

**You need:** [Node.js](https://nodejs.org) 18 or later and a free RESTHeart Cloud service.
Signing up is free.

### 1. Clone it

```bash
git clone https://github.com/SoftInstigate/restheart-cloud-starter-ng.git
cd restheart-cloud-starter-ng
npm install
```

### 2. Point it at your service

Create a **free service** at [cloud.restheart.com](https://cloud.restheart.com) and copy its URL
from the service's *Connect* page. Put it in `src/environments/environment.dev.ts` — the file
`ng serve` actually uses:

```ts
apiUrl: 'https://xxxxxx.eu-central-1-free-1.restheart.com',
```

> Use the URL of **your service**, not `cloud-api.restheart.com`. That second one is RESTHeart
> Cloud's own control panel, and pointing the app at it makes every request fail.

To keep that edit out of `git status`:

```bash
git update-index --assume-unchanged src/environments/environment.dev.ts
```

### 3. Set the service up

The app needs things of its service: the accounts plugin installed, sign-up and password reset
switched on, your origin allowed to call it. `rhc` puts them there from a file in this repo, so
there is no console checklist to follow.

```bash
npm install -g @restheart-cloud/cli
rhc login                              # paste a token from cloud.restheart.com
rhc setup --srv <srvId>
```

`<srvId>` is the six-character id of your service — the first label of its URL. Every step is a
check and an apply, so running it twice writes nothing. `--dry-run` tells you what a service is
missing without touching it.

**Want users to accept Terms and a Privacy Policy first?** Use the other setup file instead:

```bash
rhc setup --srv <srvId> --file rhc.setup.consents.ts
```

Same setup with four more documents, and the app then blocks anyone who has not accepted the
current versions until they do. The rule lives on the server, so it holds for a mobile client and
for `curl` too — not just for this app. Skip the file and nobody is ever asked: the acceptance
screen is waiting for a refusal that never comes.

Either way, replace `public/terms.html` and `public/privacy.html` — they are placeholders.

### 4. Start it

```bash
ng serve
```

Sign up, check your inbox, and you are in.

## Making it yours

The look is a scaffold, meant to be thrown away — `src/styles.css` holds the design tokens and a
disposable skin, and the home page is a placeholder for your own content. Change the tokens and
the whole app re-themes, dark mode included.

For the route map, the class hooks to restyle, how to call your own collections with the session
attached, and how the consents gate works inside, see [NOTES.md](./NOTES.md).

## Something not working?

**Everything fails, and the console says the origin is not allowed.** The service only answers
pages it has been told about. Re-run `rhc setup` after changing where the app is served from, or
add the origin under *Service → Origin Allowlist*.

**A page is missing and its link is gone.** The feature flags in `environment.dev.ts` must match
the service's *Sign-up Mgmt → Features* toggles. `rhc setup` reads the flags from that same file
and sets the service to match, so re-running it is usually the fix.

**`401` on a request you wrote yourself.** A plain `fetch` carries no session. Use `auth.api()`,
which attaches it — see [NOTES.md](./NOTES.md#reading-your-own-data).

**`rhc` runs something about OpenShift.** A different, retired tool of the same name is first in
your `PATH`. `type -a rhc` shows both.

## More

- [RESTHeart Cloud documentation](https://restheart.org/docs/cloud/)
- [`@restheart-cloud/kit-ng`](https://restheart.org/docs/cloud/kit) — the library this is built on
- [The `rhc` CLI](https://restheart.org/docs/cloud/cli)
