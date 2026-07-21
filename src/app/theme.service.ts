import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'rh-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(false);

  // `localStorage` and `document` don't exist on the server. Only the
  // client-rendered shell injects this service today, but the auth pages are
  // prerendered — without this guard, adding a theme toggle to one of them
  // would break the SSR build.
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (!this.isBrowser) return;

    if (localStorage.getItem(STORAGE_KEY) === 'dark') {
      this.dark.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  toggle(): void {
    if (!this.isBrowser) return;

    this.dark.update(v => {
      const next = !v;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }
}
