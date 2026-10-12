import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Connexion – Mini-CRM',
    loadComponent: () => import('./Feature-auth/pages/page-auth/page-auth'),
  },
  {
    path: 'entreprises',
    title: 'Entreprises – Mini-CRM',
    loadComponent: () => import('./Feature-entreprises/pages/page-entreprises/page-entreprises'),
  },
  {
    path: 'contacts',
    loadChildren: () => import('./Feature-contacts/contacts.routes'),
  },
  {
    path: 'opportunites',
    title: 'Opportunités – Mini-CRM',
    loadComponent: () => import('./Feature-opportunites/pages/page-opportunites/page-opportunites'),
  },
  {
    path: '**',
    title: 'Page introuvable – Mini-CRM',
    loadComponent: () => import('./Feature-not-found/pages/page-not-found/page-not-found'),
  },
];
