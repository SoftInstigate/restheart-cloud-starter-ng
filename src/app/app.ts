import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { isValidApiBaseUrl, setToken, scheduleRefresh } from '@restheart-cloud/kit';
import { environment } from '../environments/environment';
import { justSignedUp } from './just-signed-up';

/**
 * Read a URL fragment like #access_token=...&token_type=Bearer&expires_in=900
 * and store the token if found, and a `?flow=signup` query param — present only on the
 * one redirect that follows a fresh signup (email verification or OAuth) — used as a
 * one-shot signal for the "welcome" banner, no client-side guessing needed.
 * Clears both from the URL bar.
 */
function consumeFragmentToken(): void {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      setToken(accessToken);
      scheduleRefresh({ apiBaseUrl: environment.apiUrl });
    }
  }

  const search = new URLSearchParams(window.location.search);
  const isSignup = search.get('flow') === 'signup';
  if (isSignup) {
    justSignedUp.set(true);
    search.delete('flow');
  }

  if (!hash && !isSignup) return;

  // Clear the fragment and the one-shot `flow` marker so neither lingers in browser history
  const query = search.toString();
  history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
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
