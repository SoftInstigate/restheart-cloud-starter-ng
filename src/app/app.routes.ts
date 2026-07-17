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
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home),
      },
      {
        path: 'teams',
        loadComponent: () => import('./pages/teams/teams').then(m => m.Teams),
      },
      {
        path: 'teams/new',
        loadComponent: () => import('./pages/teams/new/new-team').then(m => m.NewTeam),
      },
      {
        path: 'teams/:id',
        loadComponent: () => import('./pages/teams/detail/team-detail').then(m => m.TeamDetail),
      },
      {
        path: 'account',
        loadComponent: () => import('./pages/account/account').then(m => m.Account),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
