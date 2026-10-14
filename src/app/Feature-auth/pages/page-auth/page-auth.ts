import { Component, inject, signal } from '@angular/core';
import { LayoutSlice } from '../../../shared/layout-slice/layout-slice';
import { Logo } from '../../../shared/logo/logo';
import { AuthService } from '../../data-access/auth-service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Component({
  imports: [LayoutSlice, Logo],
  selector: 'app-page-auth',
  styleUrl: './page-auth.css',
  templateUrl: './page-auth.html',
})
export default class PageAuth {
  authService = inject(AuthService);

  readonly test = signal<string>('chris');
  changeValue() {
    this.test.set('julien');
  }

  seConnecter() {
    this.authService.connexion();
  }

  creerCompte() {
    // this.authService.creerUnCOmpte()
  }

  constructor() {
    const listcontacts = new BehaviorSubject<unknown>([]);
    listcontacts.subscribe({
      next: (v) => console.log(`list contacts : ${v}`),
    });
    const observable = new Observable((subscriber) => {
      subscriber.next([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Marie',
          email: 'marie.dupont@techvision.fr',
          telephone: '06 12 34 56 78',
          entreprise_id: 1,
        },
        {
          id: 2,
          nom: 'Nguyen',
          prenom: 'Thomas',
          email: 'thomas.nguyen@techvision.fr',
          telephone: '06 23 45 67 89',
          entreprise_id: 1,
        },
        {
          id: 3,
          nom: 'Martin',
          prenom: 'Sophie',
          email: 'sophie.martin@stratconseil.fr',
          telephone: '07 34 56 78 90',
          entreprise_id: 2,
        },
        {
          id: 4,
          nom: 'Petit',
          prenom: 'Lucas',
          email: 'lucas.petit@shopnow.io',
          telephone: '06 45 67 89 01',
          entreprise_id: 3,
        },
        {
          id: 5,
          nom: 'Durand',
          prenom: 'Camille',
          email: 'camille.durand@finflow.fr',
          telephone: '07 56 78 90 12',
          entreprise_id: 4,
        },
      ]);
    });

    const sub = observable.subscribe({
      next(data) {
        listcontacts.next(data);
      },
    });

    // observable.subscribe({
    //   next(data) {
    //     console.log('got value ' + data);
    //   },
    //   complete() {
    //     console.log('done');
    //   },
    // });

    // const subject = new Subject<number>();

    // subject.subscribe({
    //   next: (v) => console.log(`observerA: ${v}`),
    // });
    // subject.subscribe({
    //   next: (v) => console.log(`observerB: ${v}`),
    // });

    // subject.next(Math.random());

    // const behaviorSubject = new BehaviorSubject<number>(1);

    // behaviorSubject.subscribe({
    //   next: (v) => console.log(`observerA: ${v}`),
    // });
    // behaviorSubject.subscribe({
    //   next: (v) => console.log(`observerB: ${v}`),
    // });

    // behaviorSubject.next(Math.random());
  }
  // ngOnDestroy( ){
  //   sub.unsubscribe()
  // }
}
