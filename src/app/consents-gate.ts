import { Component, inject, signal } from '@angular/core';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import { consentsBlocked } from './consents';

/**
 * Covers the app with an acceptance form while the API is answering `451`.
 *
 * It sits at the root, outside the router outlet, and that placement is the
 * point: a blocked user has no session — `/users/me` is refused too — so
 * `authGuard` fails and the navigation is cancelled. Nothing inside the outlet
 * ever renders, which is exactly why the gate cannot live there.
 *
 * The overlay is user experience, not enforcement: remove it with the dev
 * tools and every request still comes back `451`. The rule lives on the server.
 */
@Component({
  selector: 'app-consents-gate',
  templateUrl: './consents-gate.html',
  styleUrl: './consents-gate.css',
})
export class ConsentsGate {
  protected readonly auth = inject(RhAuthService);
  protected readonly blocked = consentsBlocked;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected accept(): void {
    this.busy.set(true);
    this.error.set(null);
    // The versions and the timestamp are stamped by the permission's
    // mergeRequest — this call states nothing about what is accepted. The user
    // id comes from the token, since the user document is exactly what we
    // cannot read yet.
    this.auth.acceptConsents().subscribe({
      next: () => {
        // A full reload rather than a router navigation: the guard already
        // cancelled the one that brought us here, and re-entering with a new
        // token and a readable user document is simpler to reason about than
        // replaying a failed navigation. It happens once, per user, ever.
        window.location.assign('/');
      },
      error: () => {
        this.error.set('We could not record your acceptance. Please try again.');
        this.busy.set(false);
      },
    });
  }

  protected signOut(): void {
    // Clear the flag too, or the next user to sign in on this tab meets the
    // overlay before making a single request.
    consentsBlocked.set(false);
    this.auth.logout().subscribe(() => window.location.assign('/auth/login'));
  }
}
