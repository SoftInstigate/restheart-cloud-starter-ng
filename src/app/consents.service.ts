import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

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
  readonly blocked = signal(false);
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
