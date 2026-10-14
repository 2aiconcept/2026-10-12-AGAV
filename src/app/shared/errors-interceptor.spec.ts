import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../Feature-auth/data-access/auth-service';
import { errorsInterceptor } from './errors-interceptor';

const URL_PROTEGEE = `${environment.apiBaseUrl}/entreprises`;
const URL_LOGIN = `${environment.apiBaseUrl}/auth/login`;

describe('errorsInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  const fauxAuthService = { deconnexion: vi.fn() };
  const fauxErrorHandler = { handleError: vi.fn() };

  beforeEach(() => {
    fauxAuthService.deconnexion.mockReset();
    fauxErrorHandler.handleError.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorsInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: fauxAuthService },
        { provide: ErrorHandler, useValue: fauxErrorHandler },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  function appelerEnErreur(url: string, statut: number): number | undefined {
    let statutRecu: number | undefined;
    http.get(url).subscribe({ error: (erreur: HttpErrorResponse) => (statutRecu = erreur.status) });

    httpTesting.expectOne(url).flush({ error: 'erreur' }, { status: statut, statusText: 'Erreur' });
    return statutRecu;
  }

  it('déconnecte et va sur la page de connexion sur un 401', () => {
    appelerEnErreur(URL_PROTEGEE, 401);

    expect(fauxAuthService.deconnexion).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/connexion');
  });

  it('ne déconnecte pas sur un 401 du login (mauvais mot de passe)', () => {
    appelerEnErreur(URL_LOGIN, 401);

    expect(fauxAuthService.deconnexion).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("confie une erreur 500 au gestionnaire d'erreurs global", () => {
    appelerEnErreur(URL_PROTEGEE, 500);

    expect(fauxErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, url: URL_PROTEGEE }),
    );
    expect(fauxAuthService.deconnexion).not.toHaveBeenCalled();
  });

  it('ne fait rien de spécial sur une autre erreur', () => {
    appelerEnErreur(URL_PROTEGEE, 404);

    expect(fauxAuthService.deconnexion).not.toHaveBeenCalled();
    expect(fauxErrorHandler.handleError).not.toHaveBeenCalled();
  });

  it("laisse toujours l'erreur arriver jusqu'à l'appelant", () => {
    expect(appelerEnErreur(URL_PROTEGEE, 401)).toBe(401);
  });
});
