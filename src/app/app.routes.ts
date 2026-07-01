import { Routes } from '@angular/router';
import { authGuard, publicGuard } from '@restheart-cloud/kit-ng';

export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/auth/login/login').then(m => m.Login),
  },
  {
    path: 'auth/signup',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/auth/signup/signup').then(m => m.Signup),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shell/shell').then(m => m.Shell),
  },
  { path: '**', redirectTo: '' },
];
