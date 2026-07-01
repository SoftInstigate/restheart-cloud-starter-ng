import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth/login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'auth/signup',
    renderMode: RenderMode.Prerender,
  },
  {
    // Authenticated shell — needs the live session cookie, cannot be
    // prerendered or server-rendered on request.
    path: '',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
