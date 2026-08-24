/**
 * What the consents gate needs from its RESTHeart Cloud service.
 *
 *   npm i -D @restheart-cloud/cli
 *   rhc login
 *   rhc setup --srv <srvId> --dry-run    # what is missing
 *   rhc setup --srv <srvId>              # make it so
 *
 * This is Part 1 of
 * https://cloud.restheart.com/blog/require-terms-and-privacy-acceptance — four
 * server-side documents, there configured by hand in the console, here stated
 * as code.
 *
 * ## The versions live in one place
 *
 * In the article the two version strings appear **four times**: twice in the
 * permission's `mergeRequest`, and twice in the guard rule's condition. They
 * have to agree exactly, and the failure when they do not is quiet — a user
 * accepts, the acceptance is stamped with one version, the rule compares
 * against another, and they are blocked for ever by a form that says it worked.
 *
 * Here they are `TOS_VERSION` and `PP_VERSION`, and everything is derived. That
 * is most of what this file buys over following the article: publishing new
 * terms becomes editing two strings and re-running the setup.
 *
 * ## What it deliberately does not do
 *
 * It does not write the Terms or the Privacy Policy — those are `public/`, and
 * they are yours. It only decides which *versions* the service demands.
 */
import { defineSetup, step } from '@restheart-cloud/cli';
import type { PluginConfig } from '@restheart-cloud/cli';

/**
 * Bump these when you publish new documents, and re-run the setup. Every user
 * meets the form again on their next request; the acceptance they already gave
 * stays in the `consents` history.
 */
const TOS_VERSION = '2026-07-01';
const PP_VERSION = '2026-07-01';

const SCHEMA_ID = 'userConsentsSchema';
const RULE_ID = 'consentsGate';
const PERMISSION_ID = 'userCanPatchOwnConsents';

/** Both versions, as the permission stamps them and the rule compares them. */
const accepted = { tos: TOS_VERSION, pp: PP_VERSION, acceptedAt: '@now' };

/**
 * The user document's shape, with the two consent fields.
 *
 * Note `_$date` with the underscore: `acceptedAt` is a BSON date, and the type
 * keys are escaped inside a *schema* document so the parser does not read them
 * as values while the schema is being stored. Declared as a plain string,
 * every acceptance is rejected.
 *
 * Note also what is **not** required. The document is validated as it is
 * inserted, before the initial team is attached, so a schema demanding
 * `latestConsents`, `consents` or the team fields rejects every registration.
 *
 * One consequence to know before it surprises you: `_id` **is** required, and on
 * a `PUT /users/{id}` it arrives in the path rather than the body, so a direct
 * write is refused with `required key [_id] not found`. Registration through
 * `/auth/register` sends a whole document and passes. It means `createUser` from
 * a setup file, and hand-made users generally, need the id in the body too.
 */
const USER_SCHEMA = {
  title: 'User with consents',
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['_id', 'password', 'roles', 'profile'],
  properties: {
    _id: { type: 'string' },
    _etag: { type: 'object' },
    password: { type: 'string' },
    roles: { type: 'array', items: { type: 'string' } },
    profile: {
      type: 'object',
      required: ['name', 'surname'],
      properties: {
        name: { type: 'string' },
        surname: { type: 'string' },
        avatarUrl: { type: 'string' },
      },
    },
    latestConsents: {
      type: 'object',
      properties: {
        tos: { type: 'string' },
        pp: { type: 'string' },
        acceptedAt: { type: 'object', properties: { _$date: { type: 'number' } } },
      },
      required: ['tos', 'pp'],
    },
    consents: { type: 'array' },
    socialAuths: { type: 'array' },
    teams: { type: 'array' },
    team: { type: 'object' },
  },
};

/**
 * Blocked when *either* acceptance is missing — `not (A and B)`, never
 * `not A and not B`, which would block only the users who accepted neither.
 *
 * The two path exclusions are not decoration: without them a blocked user
 * cannot get a token or sign in, and that includes you. The third exemption is
 * the acceptance itself, which is made *while still blocked*.
 *
 * `/users/me` is deliberately **not** excluded. Blocking it is what makes the
 * gate work with no probing on the client's side: reading the user document is
 * the first thing any app does.
 */
const CONDITION = [
  "not path-prefix('/auth')",
  "not path-prefix('/token')",
  "not (method(PATCH) and path-template('/users/{userId}') and bson-request-whitelist(consents))",
  `not (equals(@user.latestConsents.tos, '${TOS_VERSION}') and equals(@user.latestConsents.pp, '${PP_VERSION}'))`,
].join(' and ');

const CLAIMS = ['latestConsents/tos', 'latestConsents/pp'];

const rules = (config: PluginConfig): unknown[] =>
  (config['rules'] as unknown[] | undefined) ?? [];

export default defineSetup('Consents gate', [
  step('user schema stored', {
    check: ({ service }) => service.schemaExists(SCHEMA_ID),
    apply: ({ service }) => service.putSchema(SCHEMA_ID, USER_SCHEMA),
  }),

  step('users collection validated by it', {
    async check({ service }) {
      // `/users` lists the documents; the collection's own properties are at
      // `/users/_meta`. Reading the first and looking for `jsonSchema` finds
      // nothing, for ever, however many times the apply succeeds.
      const res = await service.fetch('/users/_meta');
      const meta = (await res.json()) as { jsonSchema?: { schemaId?: string } };
      return meta.jsonSchema?.schemaId === SCHEMA_ID;
    },
    apply: ({ service }) =>
      service.fetch('/users', {
        method: 'PATCH',
        body: JSON.stringify({ jsonSchema: { schemaId: SCHEMA_ID } }),
      }),
  }),

  step('the acceptance is permitted, and nothing else is', {
    // Without this the acceptance is a 403 and the user is locked out for good:
    // nothing authorises PATCH /users/{userId} out of the box, and a guard
    // never gets a say on a request the ACL already refused.
    check: ({ service }) => service.permissionExists(PERMISSION_ID),
    apply: ({ service }) =>
      service.putPermission(PERMISSION_ID, {
        predicate:
          "path-template('/users/{userId}') and method(PATCH) and " +
          '(equals(@user._id, ${userId}) or equals(@user.sub, ${userId})) and ' +
          'bson-request-whitelist(consents)',
        roles: ['user'],
        priority: 1,
        mongo: {
          // The server decides what is accepted. The client sends
          // `{"consents": []}` and states nothing — otherwise it could accept
          // terms it was never shown, or backdate the acceptance.
          //
          // `latestConsents` is a nested object, never dotted keys: a request
          // that sets both a field and a path inside it is refused by MongoDB
          // with `ConflictingUpdateOperators`.
          mergeRequest: {
            latestConsents: accepted,
            // `$push` escaped, and unescaped before the merge. It grows the
            // history instead of overwriting it.
            _$push: { consents: accepted },
          },
        },
      }),
  }),

  step('the two claims travel in the token', {
    // The guard reads the token, not the database. A missing claim compares
    // false for every token-authenticated user for ever — including the ones
    // who just accepted — and blocks them permanently while the condition looks
    // perfectly reasonable.
    //
    // Only these two. A JWT payload is base64, not encrypted, so everything in
    // it is readable by anyone holding the token; the `consents` history in
    // particular grows at every acceptance and no decision reads it.
    async check({ admin, srvId }) {
      const res = await admin.fetch(`/auth-config/${encodeURIComponent(srvId)}`);
      const config = (await res.json()) as { 'account-properties-claims'?: string[] };
      const current = config['account-properties-claims'] ?? [];
      return CLAIMS.every(c => current.includes(c));
    },
    async apply({ admin, srvId }) {
      const res = await admin.fetch(`/auth-config/${encodeURIComponent(srvId)}`);
      const config = (await res.json()) as { 'account-properties-claims'?: string[] };
      const current = config['account-properties-claims'] ?? [];
      await admin.fetch(`/auth-config/${encodeURIComponent(srvId)}`, {
        method: 'PATCH',
        // Added, not replaced: a service may carry claims of its own.
        body: JSON.stringify({
          'account-properties-claims': [...new Set([...current, ...CLAIMS])],
        }),
      });
    },
  }),

  step('guards plugin installed', {
    check: ({ admin, srvId }) => admin.isPluginInstalled(srvId, 'guards'),
    apply: ({ admin, srvId }) => admin.installPlugin(srvId, 'guards'),
  }),

  step('the gate blocks users who have not accepted', {
    async check({ admin, srvId }) {
      // Asked first, because reading the config of a plugin that is not
      // installed is a 404 — and a check must answer the question, not throw.
      if (!(await admin.isPluginInstalled(srvId, 'guards'))) return false;
      const config = await admin.getPluginConfig(srvId, 'guards');
      const rule = rules(config).find(r => (r as { id?: string }).id === RULE_ID) as
        | { condition?: string; status_code?: number }
        | undefined;
      // The condition is compared, not merely the rule's presence: bumping a
      // version has to show up as work outstanding, not as satisfied.
      return rule?.condition === CONDITION && rule.status_code === 451;
    },
    async apply({ admin, srvId }) {
      const config = await admin.getPluginConfig(srvId, 'guards');
      const others = rules(config).filter(r => (r as { id?: string }).id !== RULE_ID);
      await admin.updatePluginConfig(srvId, 'guards', {
        ...config,
        rules: [
          ...others,
          {
            id: RULE_ID,
            name: 'Block users who have not accepted the current ToS and Privacy Policy',
            condition: CONDITION,
            action: 'block',
            // 451 Unavailable For Legal Reasons happens to mean exactly this,
            // and is what src/consents-signal.ts keys on.
            status_code: 451,
            message: 'You must accept the current Terms of Service and Privacy Policy',
            // A rule that cannot be evaluated must not lock everyone out.
            on_error: 'allow',
          },
        ],
      });
    },
  }),
]);
