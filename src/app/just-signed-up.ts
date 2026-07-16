import { signal } from '@angular/core';

/**
 * True for the one page load right after a fresh signup — email verification or
 * OAuth. Set by app.ts from the `?flow=signup` marker on the backend's one-time
 * redirect, read once by the Shell to show the welcome banner, then reset —
 * never persisted, so it can't reappear on a later login in any browser.
 */
export const justSignedUp = signal(false);
