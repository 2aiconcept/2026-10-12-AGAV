import { Routes } from '@angular/router';
import { PageAuth } from './Feature-auth/pages/page-auth/page-auth';
import { PageNotFound } from './Feature-not-found/pages/page-not-found/page-not-found';

export const routes: Routes = [
  {
    path: '',
    component: PageAuth,
  },
  {
    path: 'entreprises',
    loadComponent: () => import('./Feature-entreprises/pages/page-entreprises/page-entreprises'),
  },
  {
    path: 'contacts',
    loadChildren: () => import('./Feature-contacts/contacts.routes').then((m) => m.contactsRoutes),
  },
  {
    path: 'opportunites', 
    loadComponent: () => import('./Feature-opportunites/pages/page-opportunites/page-opportunites'),
  },
  {
    path: '**',
    loadComponent: () => import('./Feature-not-found/pages/page-not-found/page-not-found'),
  },
];
