// inject() : récupère une dépendance (ici HttpClient) sans passer par le constructeur.
// Service : décorateur Angular 22 qui rend la classe injectable dans toute l'application.
import { inject, Service } from '@angular/core';
// HttpClient : envoie les requêtes HTTP.
// httpResource : lit des données et les expose sous forme de signals.
// HttpResourceRef : le type de ce que renvoie httpResource.
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
// firstValueFrom : transforme un Observable en Promise (pour utiliser async / await).
import { firstValueFrom } from 'rxjs';
// L'URL de l'API, différente selon l'environnement (développement / production).
import { environment } from '../../../environments/environment';
// Les types des données reçues (Entreprise) et envoyées (EntrepriseInput).
import { Entreprise } from '../models/entreprise';
import { EntrepriseInput } from '../models/entreprise-input';

// L'API est la seule source de vérité (application multi-utilisateur) : le service ne garde
// aucun état. Les lectures passent par httpResource, les écritures par firstValueFrom ;
// après une écriture, c'est la page qui recharge la ressource pour relire l'API.
// Les versions précédentes (Observable) sont gardées en commentaire pour comparer.

// @Service() : Angular crée une seule instance de ce service, partagée par toute l'application,
// et seulement au moment où quelqu'un l'injecte (il n'alourdit pas le démarrage).
@Service()
export class EntreprisesService {
  // Le client HTTP d'Angular. « private » : seul le service l'utilise.
  // « readonly » : la propriété n'est jamais réaffectée.
  private readonly http = inject(HttpClient);
  // Adresse de base de toutes les requêtes de ce service, par exemple « …/api/entreprises ».
  private readonly apiUrl = `${environment.apiBaseUrl}/entreprises`;

  // ---------------------------------------------------------------------------
  // lister : toutes les entreprises
  // ---------------------------------------------------------------------------

  // Version précédente : un Observable froid, lu dans la page par le pipe async.
  // lister(): Observable<Entreprise[]> {
  //   return this.http.get<Entreprise[]>(this.apiUrl);
  // }

  // httpResource lance la requête GET tout de suite et expose des signals :
  // value() (les données), isLoading() (chargement en cours), error() (erreur éventuelle),
  // hasValue() (données disponibles ?) et reload() (relancer la requête).
  // À appeler dans un contexte d'injection (ex. initialisation d'une propriété de composant).
  lister(): HttpResourceRef<Entreprise[] | undefined> {
    // La fonction renvoie l'URL à lire ; le type <Entreprise[]> décrit la réponse attendue.
    return httpResource<Entreprise[]>(() => this.apiUrl);
  }

  // ---------------------------------------------------------------------------
  // chargerListe : toutes les entreprises, sous forme de Promise (utilisée par le store)
  // ---------------------------------------------------------------------------

  // lister() renvoie une ressource (httpResource), qui doit être créée dans un contexte
  // d'injection : on ne peut pas l'appeler depuis une méthode du store. Le store utilise donc
  // cette version, qui fait la même requête GET mais renvoie une Promise.
  chargerListe(): Promise<Entreprise[]> {
    // GET sur /entreprises ; firstValueFrom transforme la réponse en Promise.
    return firstValueFrom(this.http.get<Entreprise[]>(this.apiUrl));
  }

  // ---------------------------------------------------------------------------
  // trouver : une entreprise par son id
  // ---------------------------------------------------------------------------

  // Version précédente (Observable) :
  // trouver(id: number): Observable<Entreprise> {
  //   return this.http.get<Entreprise>(`${this.apiUrl}/${id}`);
  // }

  // Renvoie une Promise : l'appelant peut écrire « const e = await service.trouver(3) ».
  trouver(id: number): Promise<Entreprise> {
    // http.get renvoie un Observable ; firstValueFrom s'y abonne tout de suite (la requête part)
    // et transforme la première réponse en Promise.
    return firstValueFrom(this.http.get<Entreprise>(`${this.apiUrl}/${id}`));
  }

  // ---------------------------------------------------------------------------
  // creer : POST
  // ---------------------------------------------------------------------------

  // Version précédente (Observable) :
  // creer(entreprise: EntrepriseInput): Observable<Entreprise> {
  //   return this.http.post<Entreprise>(this.apiUrl, entreprise);
  // }

  // Envoie la nouvelle entreprise ; l'API répond avec l'entreprise créée (avec son id).
  creer(entreprise: EntrepriseInput): Promise<Entreprise> {
    // POST sur /entreprises, avec l'entreprise en corps de requête (converti en JSON).
    return firstValueFrom(this.http.post<Entreprise>(this.apiUrl, entreprise));
  }

  // ---------------------------------------------------------------------------
  // modifier : PUT
  // ---------------------------------------------------------------------------

  // Version précédente (Observable) :
  // modifier(id: number, entreprise: EntrepriseInput): Observable<Entreprise> {
  //   return this.http.put<Entreprise>(`${this.apiUrl}/${id}`, entreprise);
  // }

  // Met à jour l'entreprise « id » ; l'API répond avec l'entreprise modifiée.
  modifier(id: number, entreprise: EntrepriseInput): Promise<Entreprise> {
    // PUT sur /entreprises/{id}. L'API fait une mise à jour partielle : seuls les champs
    // envoyés sont modifiés.
    return firstValueFrom(this.http.put<Entreprise>(`${this.apiUrl}/${id}`, entreprise));
  }

  // ---------------------------------------------------------------------------
  // supprimer : DELETE
  // ---------------------------------------------------------------------------

  // Version précédente (Observable) :
  // supprimer(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${id}`);
  // }

  // Supprime l'entreprise « id ». Promise<void> : on attend la fin, sans valeur à récupérer.
  supprimer(id: number): Promise<void> {
    // DELETE sur /entreprises/{id}. En cas d'erreur HTTP (404, 500…), la Promise est rejetée :
    // l'appelant peut la récupérer avec try / catch.
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
