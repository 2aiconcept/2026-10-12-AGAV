import { Routes } from '@angular/router';
import { AppShell } from './shared/app-shell/app-shell';
import { authGuard } from './Feature-auth/data-access/auth-guard';

export const routes: Routes = [
  {
    path: 'connexion',
    title: 'Connexion – Mini-CRM',
    loadComponent: () => import('./Feature-auth/pages/page-auth/page-auth'),
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      {
        path: 'entreprises',
        title: 'Entreprises – Mini-CRM',
        loadComponent: () =>
          import('./Feature-entreprises/pages/page-entreprises/page-entreprises'),
      },
      {
        path: 'contacts',
        loadChildren: () => import('./Feature-contacts/contacts.routes'),
      },
      {
        path: 'opportunites',
        title: 'Opportunités – Mini-CRM',
        loadComponent: () =>
          import('./Feature-opportunites/pages/page-opportunites/page-opportunites'),
      },
      { path: '', redirectTo: 'entreprises', pathMatch: 'full' },
    ],
  },

  {
    path: '**',
    title: 'Page introuvable – Mini-CRM',
    loadComponent: () => import('./Feature-not-found/pages/page-not-found/page-not-found'),
  },
];
