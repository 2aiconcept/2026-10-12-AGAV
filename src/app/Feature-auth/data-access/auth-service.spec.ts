import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Login } from '../models/login';
import { Register } from '../models/register';
import { User } from '../models/user';
import { AuthService } from './auth-service';

const CLE_SESSION = 'mini-crm.session';
const URL_LOGIN = `${environment.apiBaseUrl}/auth/login`;
const URL_REGISTER = `${environment.apiBaseUrl}/auth/register`;

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const identifiants: Login = { email: 'user@test.com', password: 'password123' };

  const nouveauCompte: Register = {
    email: 'jean.dupont@example.com',
    password: 'motdepasse123',
    nom: 'Dupont',
    prenom: 'Jean',
  };

  const sessionApi: User = {
    token: 'un-token-jwt',
    user: { id: 3, email: 'jean.dupont@example.com', nom: 'Dupont', prenom: 'Jean', role: 'user' },
  };

  function creerService(): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('au démarrage', () => {
    it("n'a pas de session si rien n'est stocké", () => {
      creerService();

      expect(service.session()).toBeNull();
    });

    it('reprend la session stockée dans le localStorage', () => {
      localStorage.setItem(CLE_SESSION, JSON.stringify(sessionApi));

      creerService();

      expect(service.session()).toEqual(sessionApi);
    });

    it('ignore une session stockée illisible', () => {
      localStorage.setItem(CLE_SESSION, 'pas du JSON');

      creerService();

      expect(service.session()).toBeNull();
    });
  });

  describe('connexion', () => {
    beforeEach(() => creerService());

    it("n'envoie aucune requête tant qu'on ne s'abonne pas", () => {
      service.connexion(identifiants);

      httpTesting.expectNone(URL_LOGIN);
    });

    it('envoie les identifiants en POST sur /auth/login', () => {
      service.connexion(identifiants).subscribe();

      const requete = httpTesting.expectOne(URL_LOGIN);

      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual(identifiants);
      requete.flush(sessionApi);
    });

    it('enregistre la session reçue', () => {
      service.connexion(identifiants).subscribe();

      httpTesting.expectOne(URL_LOGIN).flush(sessionApi);

      expect(service.session()).toEqual(sessionApi);
      expect(JSON.parse(localStorage.getItem(CLE_SESSION) ?? 'null')).toEqual(sessionApi);
    });

    it("n'enregistre rien et transmet l'erreur si les identifiants sont faux", () => {
      let statutErreur: number | undefined;
      service.connexion(identifiants).subscribe({ error: (erreur) => (statutErreur = erreur.status) });

      httpTesting
        .expectOne(URL_LOGIN)
        .flush({ error: 'Email ou mot de passe incorrect' }, { status: 401, statusText: 'Unauthorized' });

      expect(statutErreur).toBe(401);
      expect(service.session()).toBeNull();
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    });
  });

  describe('creerUnCompte', () => {
    beforeEach(() => creerService());

    it("n'envoie aucune requête tant qu'on ne s'abonne pas", () => {
      service.creerUnCompte(nouveauCompte);

      httpTesting.expectNone(URL_REGISTER);
    });

    it('envoie les données du compte en POST sur /auth/register', () => {
      service.creerUnCompte(nouveauCompte).subscribe();

      const requete = httpTesting.expectOne(URL_REGISTER);

      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual(nouveauCompte);
      requete.flush(sessionApi);
    });

    it('renvoie et enregistre la session du compte créé', () => {
      let reponse: User | undefined;
      service.creerUnCompte(nouveauCompte).subscribe((resultat) => (reponse = resultat));

      httpTesting.expectOne(URL_REGISTER).flush(sessionApi);

      expect(reponse).toEqual(sessionApi);
      expect(service.session()).toEqual(sessionApi);
    });

    it("transmet l'erreur si l'e-mail est déjà utilisé", () => {
      let statutErreur: number | undefined;
      service.creerUnCompte(nouveauCompte).subscribe({
        error: (erreur) => (statutErreur = erreur.status),
      });

      httpTesting
        .expectOne(URL_REGISTER)
        .flush({ error: 'Email deja utilise' }, { status: 400, statusText: 'Bad Request' });

      expect(statutErreur).toBe(400);
    });
  });

  describe('deconnexion', () => {
    it('efface la session stockée et en mémoire', () => {
      localStorage.setItem(CLE_SESSION, JSON.stringify(sessionApi));
      creerService();

      service.deconnexion();

      expect(service.session()).toBeNull();
      expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    });
  });
});
