import { inject, Service } from '@angular/core';
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Entreprise } from '../models/entreprise';
import { EntrepriseInput } from '../models/entreprise-input';

// L'API est la seule source de vérité (application multi-utilisateur) : le service ne garde
// aucun état. Les lectures passent par httpResource, les écritures par firstValueFrom ;
// après une écriture, c'est la page qui recharge la ressource pour relire l'API.
// Les versions précédentes (Observable) sont gardées en commentaire pour comparer.
@Service()
export class EntreprisesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/entreprises`;

  // ---------------------------------------------------------------------------
  // lister
  // ---------------------------------------------------------------------------

  // lister(): Observable<Entreprise[]> {
  //   return this.http.get<Entreprise[]>(this.apiUrl);
  // }

  // httpResource lance la requête tout de suite et expose des signals (value, isLoading, error).
  // À appeler dans un contexte d'injection (ex. initialisation d'une propriété de composant).
  lister(): HttpResourceRef<Entreprise[] | undefined> {
    return httpResource<Entreprise[]>(() => this.apiUrl);
  }

  // ---------------------------------------------------------------------------
  // trouver
  // ---------------------------------------------------------------------------

  // trouver(id: number): Observable<Entreprise> {
  //   return this.http.get<Entreprise>(`${this.apiUrl}/${id}`);
  // }

  trouver(id: number): Promise<Entreprise> {
    return firstValueFrom(this.http.get<Entreprise>(`${this.apiUrl}/${id}`));
  }

  // ---------------------------------------------------------------------------
  // creer
  // ---------------------------------------------------------------------------

  // creer(entreprise: EntrepriseInput): Observable<Entreprise> {
  //   return this.http.post<Entreprise>(this.apiUrl, entreprise);
  // }

  creer(entreprise: EntrepriseInput): Promise<Entreprise> {
    return firstValueFrom(this.http.post<Entreprise>(this.apiUrl, entreprise));
  }

  // ---------------------------------------------------------------------------
  // modifier
  // ---------------------------------------------------------------------------

  // modifier(id: number, entreprise: EntrepriseInput): Observable<Entreprise> {
  //   return this.http.put<Entreprise>(`${this.apiUrl}/${id}`, entreprise);
  // }

  modifier(id: number, entreprise: EntrepriseInput): Promise<Entreprise> {
    return firstValueFrom(this.http.put<Entreprise>(`${this.apiUrl}/${id}`, entreprise));
  }

  // ---------------------------------------------------------------------------
  // supprimer
  // ---------------------------------------------------------------------------

  // supprimer(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${id}`);
  // }

  supprimer(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
