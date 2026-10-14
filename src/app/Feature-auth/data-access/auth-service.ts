import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Login } from '../models/login';
import { Register } from '../models/register';
import { User } from '../models/user';

const CLE_SESSION = 'mini-crm.session';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  // Observable chaud : garde la session courante et la partage entre tous les abonnés.
  private readonly session = new BehaviorSubject<User | null>(lireSessionStockee());
  readonly session$ = this.session.asObservable();

  connexion(identifiants: Login): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/auth/login`, identifiants)
      .pipe(tap((session) => this.enregistrerSession(session)));
  }

  creerUnCompte(register: Register): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/auth/register`, register)
      .pipe(tap((session) => this.enregistrerSession(session)));
  }

  deconnexion(): void {
    localStorage.removeItem(CLE_SESSION);
    this.session.next(null);
  }

  private enregistrerSession(session: User): void {
    localStorage.setItem(CLE_SESSION, JSON.stringify(session));
    this.session.next(session);
  }
}

function lireSessionStockee(): User | null {
  const sessionStockee = localStorage.getItem(CLE_SESSION);
  if (!sessionStockee) {
    return null;
  }
  try {
    return JSON.parse(sessionStockee) as User;
  } catch {
    return null;
  }
}
