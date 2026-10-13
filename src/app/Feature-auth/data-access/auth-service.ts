import { inject, Service } from '@angular/core';
import { Register } from '../models/register';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}`;
  connexion() {}

  creerUnCompte(register: Register): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, register);
  }

  
}
