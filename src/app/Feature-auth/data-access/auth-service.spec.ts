import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Register } from '../models/register';
import { User } from '../models/user';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const nouveauCompte: Register = {
    email: 'jean.dupont@example.com',
    password: 'motdepasse123',
    nom: 'Dupont',
    prenom: 'Jean',
  };

  const reponseApi: User = {
    token: 'un-token-jwt',
    user: { id: 3, email: 'jean.dupont@example.com', nom: 'Dupont', prenom: 'Jean', role: 'user' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('creerUnCompte', () => {
    it("n'envoie aucune requête tant qu'on ne s'abonne pas", () => {
      service.creerUnCompte(nouveauCompte);

      httpTesting.expectNone(`${environment.apiBaseUrl}/auth/register`);
    });

    it('envoie les données du compte en POST sur /auth/register', () => {
      service.creerUnCompte(nouveauCompte).subscribe();

      const requete = httpTesting.expectOne(`${environment.apiBaseUrl}/auth/register`);

      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual(nouveauCompte);
      requete.flush(reponseApi);
    });

    it("renvoie le token et l'utilisateur créé", () => {
      let reponse: User | undefined;
      service.creerUnCompte(nouveauCompte).subscribe((resultat) => (reponse = resultat));

      httpTesting.expectOne(`${environment.apiBaseUrl}/auth/register`).flush(reponseApi);

      expect(reponse).toEqual(reponseApi);
    });

    it("transmet l'erreur si l'e-mail est déjà utilisé", () => {
      let statutErreur: number | undefined;
      service.creerUnCompte(nouveauCompte).subscribe({
        error: (erreur) => (statutErreur = erreur.status),
      });

      httpTesting
        .expectOne(`${environment.apiBaseUrl}/auth/register`)
        .flush({ error: 'Email deja utilise' }, { status: 400, statusText: 'Bad Request' });

      expect(statutErreur).toBe(400);
    });
  });
});
