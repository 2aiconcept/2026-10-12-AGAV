/*
 * Ce qu'il faut tester dans AuthService
 * -------------------------------------
 * Le service gère la session de l'utilisateur. Ses comportements visibles sont :
 *  - au démarrage : il reprend la session stockée dans le localStorage (ou aucune session si
 *    rien n'est stocké ou si la valeur est illisible) ;
 *  - connexion() et creerUnCompte() : ce sont des observables FROIDS (aucune requête tant qu'on
 *    ne s'abonne pas), ils envoient la bonne requête POST à l'API, puis enregistrent la session
 *    reçue (signal `session` + localStorage) ; en cas d'erreur, ils la transmettent sans rien
 *    enregistrer ;
 *  - deconnexion() : efface la session en mémoire et dans le localStorage.
 * On ne teste PAS l'implémentation interne (le signal privé, la fonction de lecture du
 * localStorage, l'opérateur `tap`) : seulement ce qu'on voit de l'extérieur, à savoir les
 * requêtes envoyées, ce que renvoient les observables, `session()` et le localStorage.
 *
 * Stratégie
 * ---------
 *  - `provideHttpClient()` + `provideHttpClientTesting()` : HttpClient fonctionne normalement mais
 *    aucune requête ne part sur le réseau ; elles sont interceptées par HttpTestingController.
 *  - HttpTestingController joue le rôle de l'API : on vérifie la requête (`expectOne`), puis on
 *    choisit la réponse (`flush`), succès ou erreur.
 *  - `httpTesting.verify()` après chaque test : échoue s'il reste une requête non traitée.
 *  - Le localStorage (fourni par jsdom) est vidé avant chaque test pour que les tests restent
 *    indépendants.
 */

// TestBed : crée un mini-environnement Angular pour instancier le service avec ses dépendances.
import { TestBed } from '@angular/core/testing';
// provideHttpClient fournit HttpClient ; HttpErrorResponse est le type des erreurs HTTP.
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
// Les outils de test HTTP : le contrôleur qui intercepte les requêtes et son provider.
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
// L'URL de l'API, prise dans l'environnement comme le fait le service.
import { environment } from '../../../environments/environment';
// Les types des données envoyées et reçues.
import { Login } from '../models/login';
import { Register } from '../models/register';
import { User } from '../models/user';
// Le service testé.
import { AuthService } from './auth-service';

// La clé du localStorage où le service range la session (même valeur que dans le service).
const CLE_SESSION = 'mini-crm.session';
// Les URL complètes attendues pour chaque requête.
const URL_LOGIN = `${environment.apiBaseUrl}/auth/login`;
const URL_REGISTER = `${environment.apiBaseUrl}/auth/register`;

// describe regroupe tous les tests du service.
describe('AuthService', () => {
  // Le service et le contrôleur HTTP, recréés pour chaque test.
  let service: AuthService;
  let httpTesting: HttpTestingController;

  // Les identifiants saisis à la connexion.
  const identifiants: Login = { email: 'user@test.com', password: 'password123' };

  // Les informations saisies pour créer un compte.
  const nouveauCompte: Register = {
    email: 'jean.dupont@example.com',
    password: 'motdepasse123',
    nom: 'Dupont',
    prenom: 'Jean',
  };

  // La session que l'API renvoie (jeton + utilisateur).
  const sessionApi: User = {
    token: 'un-token-jwt',
    user: { id: 3, email: 'jean.dupont@example.com', nom: 'Dupont', prenom: 'Jean', role: 'user' },
  };

  // Crée le service. Séparé du beforeEach car certains tests doivent d'abord remplir le
  // localStorage : le service lit la session stockée au moment de sa création.
  function creerService(): void {
    // On fournit HttpClient, puis sa version de test qui intercepte les requêtes.
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    // On récupère l'instance du service créée par l'injecteur de TestBed.
    service = TestBed.inject(AuthService);
    // On récupère le contrôleur qui joue le rôle de l'API.
    httpTesting = TestBed.inject(HttpTestingController);
  }

  // Avant chaque test : localStorage vide, pour ne pas hériter de la session d'un autre test.
  beforeEach(() => {
    localStorage.clear();
  });

  // Après chaque test : aucune requête ne doit rester en attente sans réponse.
  afterEach(() => {
    httpTesting.verify();
  });

  describe('au démarrage', () => {
    it("n'a pas de session si rien n'est stocké", () => {
      // Arrange : rien à préparer, le localStorage est vide (beforeEach).

      // Act : l'application démarre et crée le service.
      creerService();

      // Assert : aucune session.
      expect(service.session()).toBeNull();
    });

    it('reprend la session stockée dans le localStorage', () => {
      // Arrange : une session a été enregistrée lors d'une visite précédente.
      localStorage.setItem(CLE_SESSION, JSON.stringify(sessionApi));

      // Act : l'application redémarre.
      creerService();

      // Assert : l'utilisateur est toujours connecté. toEqual compare le contenu des objets.
      expect(service.session()).toEqual(sessionApi);
    });

    it('ignore une session stockée illisible', () => {
      // Arrange : une valeur abîmée (pas du JSON) traîne dans le localStorage.
      localStorage.setItem(CLE_SESSION, 'pas du JSON');

      // Act : l'application démarre.
      creerService();

      // Assert : pas de plantage, simplement aucune session.
      expect(service.session()).toBeNull();
    });
  });

  describe('connexion', () => {
    // Pour ces tests, le service peut être créé avant chaque test.
    beforeEach(() => creerService());

    it("n'envoie aucune requête tant qu'on ne s'abonne pas", () => {
      // Arrange : rien de plus à préparer.

      // Act : on appelle connexion() SANS subscribe.
      service.connexion(identifiants);

      // Assert : observable froid, aucune requête n'est partie.
      httpTesting.expectNone(URL_LOGIN);
    });

    it('envoie les identifiants en POST sur /auth/login', () => {
      // Arrange : rien de plus à préparer.

      // Act : on s'abonne, ce qui déclenche la requête.
      service.connexion(identifiants).subscribe();

      // Assert : exactement une requête vers cette URL (sinon expectOne échoue)…
      const requete = httpTesting.expectOne(URL_LOGIN);
      // … en POST, avec les identifiants dans le corps.
      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual(identifiants);
      // On répond pour terminer proprement la requête (sinon verify() échouerait).
      requete.flush(sessionApi);
    });

    it('enregistre la session reçue', () => {
      // Arrange : on s'abonne à la connexion.
      service.connexion(identifiants).subscribe();

      // Act : l'API répond avec une session (flush = « envoyer cette réponse »).
      httpTesting.expectOne(URL_LOGIN).flush(sessionApi);

      // Assert : la session est disponible en mémoire…
      expect(service.session()).toEqual(sessionApi);
      // … et sauvegardée dans le localStorage (relue et décodée pour la comparer).
      expect(JSON.parse(localStorage.getItem(CLE_SESSION) ?? 'null')).toEqual(sessionApi);
    });

    it("n'enregistre rien et transmet l'erreur si les identifiants sont faux", () => {
      // Arrange : on s'abonne en notant le statut de l'erreur reçue.
      let statutErreur: number | undefined;
      service.connexion(identifiants).subscribe({
        error: (erreur: HttpErrorResponse) => (statutErreur = erreur.status),
      });

      // Act : l'API répond 401 (le 2e argument de flush fixe le statut HTTP).
      httpTesting
        .expectOne(URL_LOGIN)
        .flush(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401, statusText: 'Unauthorized' },
        );

      // Assert : l'erreur arrive bien à l'abonné…
      expect(statutErreur).toBe(401);
      // … et aucune session n'est enregistrée, ni en mémoire ni dans le localStorage.
      expect(service.session()).toBeNull();
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    });
  });

  describe('creerUnCompte', () => {
    // Le service est créé avant chaque test de ce groupe.
    beforeEach(() => creerService());

    it("n'envoie aucune requête tant qu'on ne s'abonne pas", () => {
      // Arrange : rien de plus à préparer.

      // Act : on appelle creerUnCompte() SANS subscribe.
      service.creerUnCompte(nouveauCompte);

      // Assert : observable froid, aucune requête.
      httpTesting.expectNone(URL_REGISTER);
    });

    it('envoie les données du compte en POST sur /auth/register', () => {
      // Arrange : rien de plus à préparer.

      // Act : on s'abonne, la requête part.
      service.creerUnCompte(nouveauCompte).subscribe();

      // Assert : une seule requête, en POST, avec les données du compte.
      const requete = httpTesting.expectOne(URL_REGISTER);
      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual(nouveauCompte);
      // On répond pour clore la requête.
      requete.flush(sessionApi);
    });

    it('renvoie et enregistre la session du compte créé', () => {
      // Arrange : on s'abonne en gardant la valeur émise par l'observable.
      let reponse: User | undefined;
      service.creerUnCompte(nouveauCompte).subscribe((resultat) => (reponse = resultat));

      // Act : l'API répond avec la session du nouveau compte.
      httpTesting.expectOne(URL_REGISTER).flush(sessionApi);

      // Assert : l'abonné reçoit la session, et le service l'a enregistrée.
      expect(reponse).toEqual(sessionApi);
      expect(service.session()).toEqual(sessionApi);
      expect(JSON.parse(localStorage.getItem(CLE_SESSION) ?? 'null')).toEqual(sessionApi);
    });

    it("transmet l'erreur sans rien enregistrer si l'e-mail est déjà utilisé", () => {
      // Arrange : on s'abonne en notant le statut de l'erreur.
      let statutErreur: number | undefined;
      service.creerUnCompte(nouveauCompte).subscribe({
        error: (erreur: HttpErrorResponse) => (statutErreur = erreur.status),
      });

      // Act : l'API refuse avec un 400.
      httpTesting
        .expectOne(URL_REGISTER)
        .flush({ error: 'Email deja utilise' }, { status: 400, statusText: 'Bad Request' });

      // Assert : l'erreur est transmise et aucune session n'est enregistrée.
      expect(statutErreur).toBe(400);
      expect(service.session()).toBeNull();
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    });
  });

  describe('deconnexion', () => {
    it('efface la session stockée et en mémoire', () => {
      // Arrange : l'utilisateur est connecté (session stockée, reprise au démarrage).
      localStorage.setItem(CLE_SESSION, JSON.stringify(sessionApi));
      creerService();

      // Act : il se déconnecte.
      service.deconnexion();

      // Assert : plus de session, nulle part.
      expect(service.session()).toBeNull();
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    });
  });
});
