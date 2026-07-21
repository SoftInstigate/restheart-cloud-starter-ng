import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'rh-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(false);

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') {
      this.dark.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  toggle(): void {
    this.dark.update(v => {
      const next = !v;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }
}
