import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { getToken } from '@restheart-cloud/kit-ng';
import { environment } from '../environments/environment';

/**
 * A collection your service actually has — change it.
 *
 * It has to be a *data* path: every call the kit makes goes to `/auth/*`,
 * `/token` or `/users/me`, and those are exactly the paths the rule excludes,
 * so none of them can ever come back 451.
 */
const PROBE_PATH = '/demo';

/**
 * The consents gate, client side.
 *
 * A Guards rule on the service blocks every request from a user who has not
 * accepted the current Terms of Service and Privacy Policy, answering `451`.
 * This service is the whole detection logic: one signal, raised by the
 * interceptor below.
 *
 * Nothing here knows which versions are current — the server decides what is
 * being accepted, so bumping the versions in the Guards rule needs no change
 * and no redeploy on this side.
 */
@Injectable({ providedIn: 'root' })
export class ConsentsService {
  private readonly http = inject(HttpClient);

  readonly blocked = signal(false);

  /**
   * One data request, so a blocked user is told so on arrival rather than
   * whenever the app happens to need data.
   *
   * It goes through `HttpClient` on purpose — that is the only traffic the
   * interceptor below can see. The response is thrown away; the interceptor
   * already saw the status. The token has to be attached by hand:
   * `rhAuthInterceptor` only clears the session on 401, it does not
   * authenticate outgoing requests.
   *
   * Drop this once the app has data requests of its own on the first screen —
   * any one of them raises the flag just as well.
   */
  probe(): void {
    const token = getToken();
    if (!token) return;
    this.http
      .get(`${environment.apiUrl}${PROBE_PATH}?pagesize=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Suppress the browser's native Basic Auth popup on a 401.
          'No-Auth-Challenge': 'true',
        },
      })
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }
}

/**
 * Flags every 451 returned to an `HttpClient` request.
 *
 * This covers the app's own requests, and that is enough: the kit's calls go
 * out through `fetch` and never reach an Angular interceptor, but they all
 * target `/auth/*`, `/token` and `/users/me` — the paths the rule excludes.
 * The only requests that can come back 451 are your own.
 */
export const consentsInterceptor: HttpInterceptorFn = (req, next) => {
  const consents = inject(ConsentsService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 451) {
        consents.blocked.set(true);
      }
      return throwError(() => err);
    })
  );
};
