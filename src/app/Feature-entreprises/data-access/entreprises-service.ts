import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Entreprise } from '../models/entreprise';
import { EntrepriseInput } from '../models/entreprise-input';

// Observables froids : chaque méthode ne fait rien tant que personne ne s'y abonne.
@Service()
export class EntreprisesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/entreprises`;

  lister(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(this.apiUrl);
  }

  trouver(id: number): Observable<Entreprise> {
    return this.http.get<Entreprise>(`${this.apiUrl}/${id}`);
  }

  creer(entreprise: EntrepriseInput): Observable<Entreprise> {
    return this.http.post<Entreprise>(this.apiUrl, entreprise);
  }

  modifier(id: number, entreprise: EntrepriseInput): Observable<Entreprise> {
    return this.http.put<Entreprise>(`${this.apiUrl}/${id}`, entreprise);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
