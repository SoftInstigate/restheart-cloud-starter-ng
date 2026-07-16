import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import type { TeamMembership } from '@restheart-cloud/kit-ng';
import { environment } from '../../../environments/environment';
import { justSignedUp as justSignedUpFlag } from '../../just-signed-up';

@Component({
  selector: 'app-shell',
  imports: [ReactiveFormsModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(RhAuthService);

  protected readonly features = environment.features;

  protected readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['member' as 'owner' | 'member', [Validators.required]],
  });

  protected readonly inviteSending = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly inviteSent = signal(false);

  /** True on the one load right after a fresh signup — shows a welcome banner. */
  protected readonly justVerified = signal(justSignedUpFlag());

  constructor() {
    // Consume the shared one-shot flag now so it can't leak into a later navigation
    // back to the shell (e.g. after switching teams) or a future login.
    justSignedUpFlag.set(false);
  }

  dismissWelcome(): void {
    this.justVerified.set(false);
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }

  switchTeam(team: TeamMembership): void {
    if (team.active) return;
    this.auth.switchTeam(team.id).subscribe();
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviteSending.set(true);
    this.inviteError.set(null);
    const { email, role } = this.inviteForm.getRawValue();

    this.auth.invite(email, role).subscribe({
      next: () => {
        this.inviteSending.set(false);
        this.inviteSent.set(true);
        this.inviteForm.reset({ email: '', role: 'member' });
      },
      error: (err: unknown) => {
        this.inviteSending.set(false);
        const e = err as { status?: number; message?: string };
        this.inviteError.set(
          e?.status === 409
            ? 'This person is already a member of your team.'
            : (e?.message ?? 'Something went wrong. Please try again.')
        );
      },
    });
  }
}
