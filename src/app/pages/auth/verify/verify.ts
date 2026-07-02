import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';

@Component({
  selector: 'app-verify',
  imports: [RouterLink],
  templateUrl: './verify.html',
  styleUrl: './verify.css',
})
export class Verify {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(RhAuthService);
  private readonly router = inject(Router);

  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly missingParams = !this.email || !this.token;
  verified = false;
  error = false;

  constructor() {
    if (!this.missingParams) {
      this.auth.verify(this.email, this.token).subscribe({
        next: () => {
          this.verified = true;
        },
        error: () => {
          this.error = true;
        },
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
