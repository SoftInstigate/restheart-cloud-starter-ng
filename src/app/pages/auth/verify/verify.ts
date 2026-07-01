import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify',
  imports: [RouterLink],
  templateUrl: './verify.html',
  styleUrl: './verify.css',
})
export class Verify {
  private readonly route = inject(ActivatedRoute);

  private readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly missingParams = !this.email || !this.token;

  constructor() {
    if (!this.missingParams) {
      // The backend verifies the token, sets the session cookie, and
      // 302-redirects the browser to frontend-app-url — this must be a
      // real top-level navigation (not a fetch/XHR call), so the redirect
      // chain and Set-Cookie are handled natively by the browser.
      const url =
        `${environment.apiUrl}/auth/verify` +
        `?email=${encodeURIComponent(this.email)}&token=${encodeURIComponent(this.token)}`;
      window.location.href = url;
    }
  }
}
