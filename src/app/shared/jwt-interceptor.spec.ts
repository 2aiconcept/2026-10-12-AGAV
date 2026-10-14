/*
 * Ce qu'il faut tester : jwtInterceptor
 * -------------------------------------
 * L'intercepteur ajoute le header « Authorization: Bearer <token> » aux requêtes
 * HTTP qui partent vers notre API. On vérifie la REQUÊTE réellement envoyée :
 * - avec une session, le token est ajouté aux requêtes vers l'API ;
 * - sans session, aucun header Authorization n'est ajouté ;
 * - le token ne part JAMAIS vers un autre domaine (sécurité : un site tiers
 *   ne doit pas recevoir notre jeton) ;
 * - le token est lu à chaque requête : si la session change, la requête
 *   suivante utilise le nouveau token.
 * On ne teste PAS le fait que la requête soit clonée : c'est un détail interne.
 *
 * Stratégie :
 * - provideHttpClient(withInterceptors([jwtInterceptor])) : un vrai HttpClient
 *   qui passe par notre intercepteur, comme dans l'application ;
 * - provideHttpClientTesting() : aucune requête ne part sur le réseau, elles
 *   sont capturées par HttpTestingController ;
 * - un faux AuthService qui expose seulement le signal `session`, que l'on
 *   modifie à volonté dans les tests.
 */

// signal / WritableSignal : pour la fausse session pilotée par les tests.
import { signal, WritableSignal } from '@angular/core';
// TestBed : prépare l'injection de dépendances du test.
import { TestBed } from '@angular/core/testing';
// HttpClient : pour lancer des requêtes ; withInterceptors : pour brancher l'intercepteur.
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
// HttpTestingController : intercepte les requêtes pour les inspecter et y répondre.
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
// L'URL de l'API, la même que celle utilisée par l'intercepteur.
import { environment } from '../../environments/environment';
// Le service à remplacer par un faux.
import { AuthService } from '../Feature-auth/data-access/auth-service';
// Le type de la session.
import { User } from '../Feature-auth/models/user';
// L'intercepteur à tester.
import { jwtInterceptor } from './jwt-interceptor';

// Constantes nommées plutôt que des URL en dur dans chaque test.
const URL_API = `${environment.apiBaseUrl}/entreprises`;
const URL_AUTRE_DOMAINE = 'https://autre-site.example.com/donnees';

describe('jwtInterceptor', () => {
  // Recréés avant chaque test.
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let session: WritableSignal<User | null>;

  // Donnée de test : une session connectée.
  const sessionConnectee: User = {
    token: 'un-token-jwt',
    user: { id: 2, email: 'user@test.com', nom: 'Stagiaire', prenom: 'Angular', role: 'user' },
  };

  beforeEach(() => {
    // Par défaut, quelqu'un est connecté.
    session = signal<User | null>(sessionConnectee);

    TestBed.configureTestingModule({
      providers: [
        // Un HttpClient qui passe par notre intercepteur.
        provideHttpClient(withInterceptors([jwtInterceptor])),
        // Remplace le réseau par un contrôleur de test (à déclarer APRÈS provideHttpClient).
        provideHttpClientTesting(),
        // Le faux AuthService : l'intercepteur ne lit que session().
        { provide: AuthService, useValue: { session } },
      ],
    });
    // TestBed.inject() récupère les instances fournies ci-dessus.
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // afterEach() s'exécute après chaque test : verify() échoue s'il reste une
  // requête à laquelle on n'a pas répondu (requête inattendue ou oubliée).
  afterEach(() => {
    httpTesting.verify();
  });

  it("ajoute le token dans le header Authorization des requêtes vers l'API", () => {
    // Arrange : session connectée (beforeEach).

    // Act : on lance une requête (subscribe() est nécessaire : un observable froid ne part pas sans abonné).
    http.get(URL_API).subscribe();
    // expectOne() vérifie qu'UNE requête est partie vers cette URL et la renvoie.
    const requete = httpTesting.expectOne(URL_API);

    // Assert : la requête capturée porte le header attendu.
    expect(requete.request.headers.get('Authorization')).toBe('Bearer un-token-jwt');
    // flush() envoie une fausse réponse pour terminer la requête.
    requete.flush([]);
  });

  it("n'ajoute rien sans session", () => {
    // Arrange : personne n'est connecté.
    session.set(null);

    // Act : requête vers l'API.
    http.get(URL_API).subscribe();
    const requete = httpTesting.expectOne(URL_API);

    // Assert : pas de header Authorization.
    expect(requete.request.headers.has('Authorization')).toBe(false);
    requete.flush([]);
  });

  it("n'envoie jamais le token vers un autre domaine", () => {
    // Arrange : session connectée (beforeEach).

    // Act : requête vers un site qui n'est pas notre API.
    http.get(URL_AUTRE_DOMAINE).subscribe();
    const requete = httpTesting.expectOne(URL_AUTRE_DOMAINE);

    // Assert : le token n'a pas fuité.
    expect(requete.request.headers.has('Authorization')).toBe(false);
    requete.flush({});
  });

  it('utilise le token de la session au moment de chaque requête', () => {
    // Arrange : une première requête part avec le token initial.
    http.get(URL_API).subscribe();
    httpTesting.expectOne(URL_API).flush([]);

    // Act : la session change (nouveau token), puis une seconde requête part.
    session.set({ ...sessionConnectee, token: 'nouveau-token' });
    http.get(URL_API).subscribe();
    const requete = httpTesting.expectOne(URL_API);

    // Assert : la seconde requête porte le nouveau token, pas l'ancien.
    expect(requete.request.headers.get('Authorization')).toBe('Bearer nouveau-token');
    requete.flush([]);
  });
});
