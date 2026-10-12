import { Routes } from '@angular/router';

const contactsRoutes: Routes = [
  {
    path: '',
    title: 'Contacts – Mini-CRM',
    loadComponent: () => import('./pages/page-contacts/page-contacts'),
  },
  {
    path: 'ajouter',
    title: 'Ajouter un contact – Mini-CRM',
    loadComponent: () => import('./pages/page-ajouter-contact/page-ajouter-contact'),
  },
  {
    path: 'editer/:id',
    title: 'Modifier un contact – Mini-CRM',
    loadComponent: () => import('./pages/page-editer-contact/page-editer-contact'),
  },
];

export default contactsRoutes;
