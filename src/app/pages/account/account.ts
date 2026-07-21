import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RhAuthService } from '@restheart-cloud/kit-ng';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(RhAuthService);

  // ── Profile ────────────────────────────────────────────────────────────
  protected readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
  });
  protected readonly profileSaving = signal(false);
  protected readonly profileSaved = signal(false);
  protected readonly profileError = signal<string | null>(null);

  // ── Change password ───────────────────────────────────────────────────
  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly passwordSaving = signal(false);
  protected readonly passwordSaved = signal(false);
  protected readonly passwordError = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.checkSession().subscribe(user => {
      if (user) {
        this.profileForm.patchValue({
          firstName: user.profile?.name ?? '',
          lastName: user.profile?.surname ?? '',
        });
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSaving.set(true);
    this.profileError.set(null);
    this.profileSaved.set(false);

    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.profileSaved.set(true);
      },
      error: (err: unknown) => {
        this.profileSaving.set(false);
        const e = err as { message?: string };
        this.profileError.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordSaving.set(true);
    this.passwordError.set(null);
    this.passwordSaved.set(false);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSaved.set(true);
        this.passwordForm.reset({ currentPassword: '', newPassword: '' });
      },
      error: (err: unknown) => {
        this.passwordSaving.set(false);
        const e = err as { message?: string };
        this.passwordError.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
