import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideRhAuth } from '@restheart-cloud/kit-ng';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { environment } from '../environments/environment';

// If apiUrl isn't set, provide no routes at all — this prevents the
// router's initial navigation from running route guards (e.g. authGuard's
// checkSession()) against a non-existent backend. See app.html for the
// "configure your service" screen shown in this case.
const activeRoutes = environment.apiUrl ? routes : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(activeRoutes),
    provideClientHydration(withEventReplay()),
    provideRhAuth({ apiBaseUrl: environment.apiUrl }),
  ],
};
