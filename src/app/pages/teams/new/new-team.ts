import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import type { TeamMembership } from '@restheart-cloud/kit-ng';
import { Alert } from '../../../ui/alert/alert';

@Component({
  selector: 'app-new-team',
  imports: [ReactiveFormsModule, RouterLink, Alert],
  templateUrl: './new-team.html',
  styleUrl: './new-team.css',
})
export class NewTeam {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(RhAuthService);

  protected readonly form = this.fb.nonNullable.group({
    teamName: ['', [Validators.required]],
  });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  // Mock createTeam() doesn't update auth.teams() (no real backend to source
  // it from yet, see restheart#643) — show the result inline instead of
  // navigating away, so there's visible confirmation something happened.
  protected readonly created = signal<TeamMembership | null>(null);

  createTeam(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const { teamName } = this.form.getRawValue();

    this.auth.createTeam(teamName).subscribe({
      next: team => {
        this.saving.set(false);
        this.created.set(team);
        this.form.markAsPristine();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const e = err as { message?: string };
        this.error.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
