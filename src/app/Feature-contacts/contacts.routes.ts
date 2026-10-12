import { Routes } from '@angular/router';
import PageContacts from './pages/page-contacts/page-contacts';
import { PageAjouterContact } from './pages/page-ajouter-contact/page-ajouter-contact';
import { PageEditerContact } from './pages/page-editer-contact/page-editer-contact';

export const contactsRoutes: Routes = [
  {
    path: '',
    component: PageContacts,
  },
  {
    path: 'ajouter',
    component: PageAjouterContact,
  },
  {
    path: 'editer/:id',
    component: PageEditerContact,
  },
];
