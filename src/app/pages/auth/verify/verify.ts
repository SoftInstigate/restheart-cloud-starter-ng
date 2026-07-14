import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { buildVerifyUrl } from '@restheart-cloud/kit';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify',
  imports: [RouterLink],
  templateUrl: './verify.html',
  styleUrl: './verify.css',
})
export class Verify {
  private readonly route = inject(ActivatedRoute);

  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly error = this.route.snapshot.queryParamMap.get('error');

  readonly missingParams = !this.email || !this.token;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (!this.missingParams && !this.error && this.isBrowser) {
      // Flag so the Shell can show a "welcome" banner after email verification.
      // Must be set *before* the redirect, since sessionStorage survives
      // a full-page navigation but not a new tab / session.
      sessionStorage.setItem('rh_just_verified', '1');

      // Build the verify URL with fragment delivery (Bearer token mode).
      // The backend verifies the token, then 302-redirects the browser
      // back to the frontend with #access_token=... in the URL hash.
      window.location.href = buildVerifyUrl(
        { apiBaseUrl: environment.apiUrl },
        this.email,
        this.token
      );
    }
  }
}
