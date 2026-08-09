import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import { ConsentsService } from '../../consents.service';

/**
 * Covers the app with an acceptance form while the API is answering `451`.
 *
 * The overlay is user experience, not enforcement: remove it with the dev
 * tools and every request still comes back `451`. The rule lives on the
 * server.
 */
@Component({
  selector: 'app-consents-gate',
  templateUrl: './consents-gate.html',
  styleUrl: './consents-gate.css',
})
export class ConsentsGate {
  private readonly router = inject(Router);
  protected readonly auth = inject(RhAuthService);
  protected readonly consents = inject(ConsentsService);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Ask once on arrival, so a blocked user meets the form immediately.
    this.consents.probe();
  }

  protected accept(): void {
    this.busy.set(true);
    this.error.set(null);
    // The versions and the timestamp are stamped by the permission's
    // mergeRequest — this call states nothing about what is accepted.
    // acceptConsents() also renews the token and reloads the user, so there
    // is nothing to refresh afterwards.
    this.auth.acceptConsents().subscribe({
      next: () => {
        this.consents.blocked.set(false);
        this.busy.set(false);
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
    this.consents.blocked.set(false);
    // authGuard only runs on navigation, so logging out is not enough on its
    // own — the shell would stay on screen with no user behind it.
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }
}
