import { signal } from '@angular/core';
import type { ApiError } from '@restheart-cloud/kit-ng';

/**
 * The consents gate, client side.
 *
 * A Guards rule on the service blocks every request from a user who has not
 * accepted the current Terms of Service and Privacy Policy, answering `451`.
 * `/users/me` is one of those requests, so the very first thing the app does on
 * load — restoring the session — is what trips the gate. There is nothing to
 * probe and no collection to set up.
 *
 * Nothing here knows which versions are current — the server decides what is
 * being accepted, so bumping the versions in the Guards rule needs no change
 * and no redeploy on this side.
 *
 * A plain module rather than a service, because `onError` is handed to
 * `provideRhAuth` while the injector is still being built — there is nothing to
 * inject from yet. Signals work perfectly well outside DI.
 */
export const consentsBlocked = signal(false);

/**
 * Raises the flag on any `451` from the service.
 *
 * Passed to `provideRhAuth` as `config.onError`. Session restoration happens on
 * its own schedule and `authGuard` absorbs its failures, so this is the only
 * place that gets to see why it failed — without it, "blocked" and "signed out"
 * are the same thing to the app.
 */
export function consentsOnError(err: ApiError): void {
  if (err.status === 451) consentsBlocked.set(true);
}
