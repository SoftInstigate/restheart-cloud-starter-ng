import { environment } from '../environments/environment';

/** Builds the redirect URL for `GET /auth/oauth/authorize/{provider}`. */
export function oauthUrl(provider: string): string {
  return `${environment.apiUrl}/auth/oauth/authorize/${provider}`;
}
