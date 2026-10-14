import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { AuthService } from '../Feature-auth/data-access/auth-service';
import { User } from '../Feature-auth/models/user';
import { jwtInterceptor } from './jwt-interceptor';

const URL_API = `${environment.apiBaseUrl}/entreprises`;
const URL_AUTRE_DOMAINE = 'https://autre-site.example.com/donnees';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let session: WritableSignal<User | null>;

  const sessionConnectee: User = {
    token: 'un-token-jwt',
    user: { id: 2, email: 'user@test.com', nom: 'Stagiaire', prenom: 'Angular', role: 'user' },
  };

  beforeEach(() => {
    session = signal<User | null>(sessionConnectee);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { session } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it("ajoute le token dans le header Authorization des requêtes vers l'API", () => {
    http.get(URL_API).subscribe();

    const requete = httpTesting.expectOne(URL_API);

    expect(requete.request.headers.get('Authorization')).toBe('Bearer un-token-jwt');
    requete.flush([]);
  });

  it("n'ajoute rien sans session", () => {
    session.set(null);

    http.get(URL_API).subscribe();

    const requete = httpTesting.expectOne(URL_API);

    expect(requete.request.headers.has('Authorization')).toBe(false);
    requete.flush([]);
  });

  it("n'envoie jamais le token vers un autre domaine", () => {
    http.get(URL_AUTRE_DOMAINE).subscribe();

    const requete = httpTesting.expectOne(URL_AUTRE_DOMAINE);

    expect(requete.request.headers.has('Authorization')).toBe(false);
    requete.flush({});
  });

  it('utilise le token de la session au moment de la requête', () => {
    session.set({ ...sessionConnectee, token: 'nouveau-token' });

    http.get(URL_API).subscribe();

    const requete = httpTesting.expectOne(URL_API);

    expect(requete.request.headers.get('Authorization')).toBe('Bearer nouveau-token');
    requete.flush([]);
  });
});
