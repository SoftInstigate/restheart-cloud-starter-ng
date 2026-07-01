import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isValidApiBaseUrl } from '@restheart-cloud/kit';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly apiConfigured = isValidApiBaseUrl(environment.apiUrl);

  constructor() {
    if (!this.apiConfigured) {
      console.error(
        `[app] apiUrl must point to a RESTHeart Cloud service (*.restheart.com), got "${environment.apiUrl}". ` +
          'Set it in src/environments/environment.ts (and environment.dev.ts for local development).'
      );
    }
  }
}
