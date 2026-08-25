/**
 * What this starter needs from its RESTHeart Cloud service.
 *
 *   npm i -D @restheart-cloud/cli
 *   rhc login
 *   rhc setup --srv <srvId> --dry-run    # what is missing
 *   rhc setup --srv <srvId>              # make it so
 *
 * Every step is a `check` and an `apply`: run it against a service already
 * configured and it writes nothing and reports each step satisfied. `--dry-run`
 * runs the checks only, which is the honest answer to "what is this service
 * missing".
 *
 * ## Why the feature flags are read, not written
 *
 * `environment.dev.ts` used to carry this instruction:
 *
 * > Match these to the "Features" toggles of your RESTHeart Cloud service. A
 * > feature that's off on the server returns 403 to unauthenticated users.
 *
 * Two lists that must agree, kept in step by hand, in different repositories.
 * Nothing checked that they did, and the symptom of drift is a `403` on a
 * button the app went to the trouble of rendering.
 *
 * So this file **imports the same environment the app imports** and derives the
 * server's configuration from it. The flags are stated once. Turning
 * `passwordReset` off in the app and re-running the setup turns it off on the
 * service too, because there is no second place to forget.
 */
import { defineSetup, step, fromEnv, isRedacted } from '@restheart-cloud/cli';
import { isApiError } from '@restheart-cloud/cli';
import type { AdminClient, PluginConfig } from '@restheart-cloud/cli';
import { environment } from './src/environments/environment.dev.ts';

/** Where the app is served from, no trailing slash. */
const APP_URL = (process.env.APP_URL ?? 'http://localhost:4200').replace(/\/$/, '');

/** Shown in verification, reset and invitation emails. */
const APP_NAME = process.env.APP_NAME ?? 'RESTHeart Cloud Starter';

const f = environment.features;

/** A stored secret reads back as bullets; one never set reads back blank. */
const configured = (value: unknown) =>
  isRedacted(value) || (typeof value === 'string' && value.length > 0);

const section = (config: PluginConfig, key: string): PluginConfig =>
  (config[key] as PluginConfig | undefined) ?? {};

/**
 * The server's toggles, derived from the app's.
 *
 * `emailRegistration` covers two server flags, because from the app's side
 * signing up and confirming the address are one flow: offering the form and
 * then not verifying is not a mode anyone wants.
 */
const features = {
  registration: f.emailRegistration,
  verification: f.emailRegistration,
  'password-reset': f.passwordReset,
  invitations: f.teamInvitations,
  oauth: f.oauthLogin,
};

/**
 * Install a plugin, treating "already installed" as the success it is.
 *
 * The step's desired state is that the plugin is there. `409 Plugin already
 * installed` says it is, so failing on it reports a problem that does not
 * exist — which is exactly what a forced run does, since the apply then runs
 * against a service where the check would have said yes.
 */
const install = async (admin: AdminClient, srvId: string, pluginId: string) => {
  try {
    await admin.installPlugin(srvId, pluginId);
  } catch (err) {
    if (!isApiError(err) || err.status !== 409) throw err;
  }
};

export default defineSetup('Angular starter', [
  step('accounts plugin installed', {
    check: ({ admin, srvId }) => admin.isPluginInstalled(srvId, 'accounts'),
    apply: ({ admin, srvId }) => install(admin, srvId, 'accounts'),
  }),

  step('accounts configured to match the app', {
    async check({ admin, srvId }) {
      const config = await admin.getPluginConfig(srvId, 'accounts');
      const current = section(config, 'features');
      return (
        config['app-name'] === APP_NAME &&
        config['frontend-url'] === APP_URL &&
        Object.entries(features).every(([k, v]) => current[k] === v)
      );
    },
    async apply({ admin, srvId }) {
      const current = await admin.getPluginConfig(srvId, 'accounts');
      // Read-modify-write with the redaction placeholders passed straight back:
      // the server replaces the whole document and restores the stored value
      // for any field still holding one. Diffing or stripping "empty-looking"
      // fields here would write bullets over a real secret.
      await admin.updatePluginConfig(srvId, 'accounts', {
        ...current,
        'app-name': APP_NAME,
        // Where the links in verification, reset and invitation emails point.
        // Wrong, and every one of those emails is a dead end — which is the
        // kind of failure nobody sees until a real user hits it.
        'frontend-url': APP_URL,
        features: { ...section(current, 'features'), ...features },
      });
    },
  }),

  // Only when the app says it offers Google — a server with the feature on and
  // no credentials answers the OAuth redirect with an error, which is worse
  // than not offering the button.
  ...(f.oauthLogin && (f.oauthProviders as readonly string[]).includes('google')
    ? [
        step('google oauth credentials', {
          async check({ admin, srvId }) {
            const oauth = section(await admin.getPluginConfig(srvId, 'accounts'), 'oauth');
            const google = (oauth['google'] as PluginConfig | undefined) ?? {};
            return (
              google['enabled'] === true &&
              configured(google['client-id']) &&
              configured(google['client-secret'])
            );
          },
          async apply({ admin, srvId }) {
            const current = await admin.getPluginConfig(srvId, 'accounts');
            const oauth = section(current, 'oauth');
            const google = (oauth['google'] as PluginConfig | undefined) ?? {};
            await admin.updatePluginConfig(srvId, 'accounts', {
              ...current,
              oauth: {
                ...oauth,
                google: {
                  ...google,
                  enabled: true,
                  // Named, not held: resolved at apply time and only when the
                  // value is not already stored, so a re-run against a
                  // configured service needs no secrets in the environment.
                  'client-id': configured(google['client-id'])
                    ? google['client-id']
                    : fromEnv('GOOGLE_CLIENT_ID'),
                  'client-secret': configured(google['client-secret'])
                    ? google['client-secret']
                    : fromEnv('GOOGLE_CLIENT_SECRET'),
                },
              },
            });
          },
        }),
      ]
    : []),

  step('the app origin may call the service', {
    // The browser calls the service directly, so the service decides which
    // origins it answers. Left unset this is permissive, which is fine on a
    // free service you are learning on and wrong everywhere else — and it is
    // exactly the step that gets skipped, because nothing fails until the day
    // it matters.
    check: async ({ admin, srvId }) => {
      if (!(await admin.isPluginInstalled(srvId, 'origin-allowlist'))) return false;
      const config = await admin.getPluginConfig(srvId, 'origin-allowlist');
      const origins = (config['allowed-origins'] as string[] | undefined) ?? [];
      return origins.includes(APP_URL);
    },
    apply: async ({ admin, srvId }) => {
      if (!(await admin.isPluginInstalled(srvId, 'origin-allowlist'))) {
        await install(admin, srvId, 'origin-allowlist');
      }
      const config = await admin.getPluginConfig(srvId, 'origin-allowlist');
      const origins = (config['allowed-origins'] as string[] | undefined) ?? [];
      // Added, never replaced: a service reached from more than one origin —
      // localhost and the deployed app — must keep both.
      await admin.updatePluginConfig(srvId, 'origin-allowlist', {
        ...config,
        'allowed-origins': [...new Set([...origins, APP_URL])],
      });
    },
  }),
]);
