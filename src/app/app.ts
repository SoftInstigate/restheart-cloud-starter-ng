import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { isValidApiBaseUrl, setToken, scheduleRefresh } from '@restheart-cloud/kit';
import { environment } from '../environments/environment';

/**
 * Read a URL fragment like #access_token=...&token_type=Bearer&expires_in=900
 * and store the token if found. Clears the fragment from the URL bar.
 */
function consumeFragmentToken(): void {
  const hash = window.location.hash;
  if (!hash) return;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  if (accessToken) {
    setToken(accessToken);
    scheduleRefresh({ apiBaseUrl: environment.apiUrl });
  }

  // Clear the fragment so the token doesn't linger in browser history
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly apiConfigured = isValidApiBaseUrl(environment.apiUrl);

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (!this.apiConfigured) {
      console.error(
        `[app] apiUrl must point to a RESTHeart Cloud service (*.restheart.com), got "${environment.apiUrl}". ` +
          'Set it in src/environments/environment.ts (and environment.dev.ts for local development).'
      );
      return;
    }

    // On app load, check if the URL contains a token fragment
    // (e.g. after email verification or OAuth redirect)
    if (this.isBrowser) {
      consumeFragmentToken();
    }
  }
}
