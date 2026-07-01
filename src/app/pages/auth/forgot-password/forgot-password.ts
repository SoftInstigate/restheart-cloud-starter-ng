import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(RhAuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly loading = signal(false);
  readonly submitted = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email } = this.form.getRawValue();

    // The API always returns 202 here regardless of whether the email
    // exists, to avoid leaking which emails are registered — so there's
    // no error case to handle, just show the same confirmation either way.
    this.auth.forgotPassword(email).subscribe({
      next: () => this.submitted.set(true),
      error: () => this.submitted.set(true),
    });
  }
}
