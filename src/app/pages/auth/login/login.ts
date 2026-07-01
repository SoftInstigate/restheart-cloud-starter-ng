import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import { environment } from '../../../../environments/environment';
import { OauthButtons } from '../oauth-buttons/oauth-buttons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, OauthButtons],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(RhAuthService);
  private readonly router = inject(Router);

  protected readonly features = environment.features;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: unknown): string {
    const e = err as { status?: number; message?: string };
    if (e?.status === 401) return 'Invalid email or password.';
    return e?.message ?? 'Something went wrong. Please try again.';
  }
}
