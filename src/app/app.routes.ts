import { Routes } from '@angular/router';
import { authGuard, publicGuard } from '@restheart-cloud/kit-ng';
import { environment } from '../environments/environment';

const { emailRegistration, passwordReset, oauthLogin, teamInvitations } = environment.features;

export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/auth/login/login').then(m => m.Login),
  },
  ...(emailRegistration || oauthLogin
    ? [
        {
          path: 'auth/signup',
          canActivate: [publicGuard],
          loadComponent: () => import('./pages/auth/signup/signup').then(m => m.Signup),
        },
      ]
    : []),
  ...(emailRegistration
    ? [
        {
          path: 'auth/verify',
          canActivate: [publicGuard],
          loadComponent: () => import('./pages/auth/verify/verify').then(m => m.Verify),
        },
      ]
    : []),
  ...(passwordReset
    ? [
        {
          path: 'auth/forgot-password',
          canActivate: [publicGuard],
          loadComponent: () =>
            import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
        },
        {
          path: 'auth/reset-password',
          canActivate: [publicGuard],
          loadComponent: () =>
            import('./pages/auth/reset-password/reset-password').then(m => m.ResetPassword),
        },
      ]
    : []),
  ...(teamInvitations
    ? [
        {
          // Accessible whether logged in or not — the page itself branches
          // on isNewUser / isAuthenticated, so it has no route guard.
          path: 'invitations/accept',
          loadComponent: () =>
            import('./pages/invitations/accept/accept').then(m => m.Accept),
        },
      ]
    : []),
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shell/shell').then(m => m.Shell),
  },
  { path: '**', redirectTo: '' },
];
