import { inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Login } from '../models/login';
import { Register } from '../models/register';
import { User } from '../models/user';

const CLE_SESSION = 'mini-crm.session';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  // Seul le service modifie la session ; le reste de l'application la lit en lecture seule.
  private readonly sessionCourante = signal<User | null>(lireSessionStockee());
  readonly session = this.sessionCourante.asReadonly();

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
    this.sessionCourante.set(null);
  }

  private enregistrerSession(session: User): void {
    localStorage.setItem(CLE_SESSION, JSON.stringify(session));
    this.sessionCourante.set(session);
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
