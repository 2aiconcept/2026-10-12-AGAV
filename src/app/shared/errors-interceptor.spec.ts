/*
 * Ce qu'il faut tester : errorsInterceptor
 * ----------------------------------------
 * L'intercepteur réagit aux erreurs HTTP de façon centralisée. On vérifie ce
 * qu'il DÉCLENCHE selon le code d'erreur reçu :
 * - 401 sur une route protégée (token absent ou expiré) : déconnexion puis
 *   redirection vers /connexion ;
 * - 401 sur /auth/login (mauvais mot de passe) : rien, c'est au formulaire
 *   d'afficher l'erreur, l'utilisateur ne doit pas être redirigé ;
 * - 500 : l'erreur est confiée au gestionnaire d'erreurs global (ErrorHandler) ;
 * - une autre erreur (404…) : rien de spécial ;
 * - une réponse réussie : rien du tout ;
 * - dans tous les cas, l'erreur continue jusqu'au code qui a fait l'appel
 *   (l'intercepteur observe l'erreur, il ne l'avale pas).
 *
 * Stratégie :
 * - un vrai HttpClient branché sur l'intercepteur (withInterceptors), et
 *   HttpTestingController pour répondre en erreur avec flush(…, { status }) ;
 * - de FAUX AuthService et ErrorHandler (objets avec des fonctions espions vi.fn()) ;
 * - Router.navigateByUrl espionné avec vi.spyOn() pour vérifier la redirection
 *   sans naviguer réellement.
 */

// ErrorHandler : le gestionnaire d'erreurs global d'Angular, qu'on remplace par un faux.
import { ErrorHandler } from '@angular/core';
// TestBed : prépare l'injection de dépendances du test.
import { TestBed } from '@angular/core/testing';
// HttpClient et ses outils ; HttpErrorResponse : le type de l'erreur reçue par l'appelant.
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
// HttpTestingController : capture les requêtes pour y répondre à la main.
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
// provideRouter : fournit le routeur ; Router : le service qu'on espionne.
import { provideRouter, Router } from '@angular/router';
// L'URL de base de l'API.
import { environment } from '../../environments/environment';
// Le service à remplacer par un faux.
import { AuthService } from '../Feature-auth/data-access/auth-service';
// L'intercepteur à tester.
import { errorsInterceptor } from './errors-interceptor';

// Une route protégée par le token, et la route de connexion.
const URL_PROTEGEE = `${environment.apiBaseUrl}/entreprises`;
const URL_LOGIN = `${environment.apiBaseUrl}/auth/login`;

describe('errorsInterceptor', () => {
  // Recréés avant chaque test : aucun espion ne garde les appels d'un test précédent.
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let fauxAuthService: { deconnexion: ReturnType<typeof vi.fn> };
  let fauxErrorHandler: { handleError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Faux services neufs : vi.fn() crée des fonctions espions qui mémorisent leurs appels.
    fauxAuthService = { deconnexion: vi.fn() };
    fauxErrorHandler = { handleError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        // Un HttpClient qui passe par notre intercepteur.
        provideHttpClient(withInterceptors([errorsInterceptor])),
        // Pas de réseau : les requêtes sont capturées par HttpTestingController.
        provideHttpClientTesting(),
        // L'intercepteur injecte Router : on fournit un routeur sans route.
        provideRouter([]),
        // useValue : quand on demande X, Angular donne notre faux objet.
        { provide: AuthService, useValue: fauxAuthService },
        { provide: ErrorHandler, useValue: fauxErrorHandler },
      ],
    });
    // Récupération des instances à utiliser dans les tests.
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    // vi.spyOn() espionne la vraie méthode ; mockResolvedValue(true) évite une vraie navigation.
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  // Après chaque test : aucune requête ne doit rester sans réponse.
  afterEach(() => {
    httpTesting.verify();
  });

  // Lance une requête GET, y répond en erreur avec le statut demandé,
  // et renvoie le statut reçu par l'appelant (undefined s'il n'a rien reçu).
  function appelerEnErreur(url: string, statut: number): number | undefined {
    let statutRecu: number | undefined;
    // On s'abonne en gérant l'erreur, comme le ferait un composant.
    http.get(url).subscribe({ error: (erreur: HttpErrorResponse) => (statutRecu = erreur.status) });
    // flush() avec un status d'erreur : HttpClient émet une HttpErrorResponse.
    httpTesting.expectOne(url).flush({ error: 'erreur' }, { status: statut, statusText: 'Erreur' });
    return statutRecu;
  }

  it('déconnecte et va sur la page de connexion sur un 401', () => {
    // Arrange : la requête vise une route protégée.

    // Act : l'API répond 401 (token absent ou expiré).
    appelerEnErreur(URL_PROTEGEE, 401);

    // Assert : déconnexion et redirection.
    expect(fauxAuthService.deconnexion).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/connexion');
  });

  it('ne déconnecte pas sur un 401 du login (mauvais mot de passe)', () => {
    // Arrange : la requête vise la route de connexion.

    // Act : l'API répond 401 (identifiants incorrects).
    appelerEnErreur(URL_LOGIN, 401);

    // Assert : ni déconnexion ni redirection.
    expect(fauxAuthService.deconnexion).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("confie une erreur 500 au gestionnaire d'erreurs global", () => {
    // Arrange : requête vers une route protégée.

    // Act : l'API répond 500.
    appelerEnErreur(URL_PROTEGEE, 500);

    // Assert : objectContaining() vérifie seulement les propriétés utiles de l'erreur transmise.
    expect(fauxErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, url: URL_PROTEGEE }),
    );
    // Une erreur serveur ne doit pas déconnecter l'utilisateur.
    expect(fauxAuthService.deconnexion).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('ne fait rien de spécial sur une autre erreur', () => {
    // Arrange : requête vers une route protégée.

    // Act : l'API répond 404.
    appelerEnErreur(URL_PROTEGEE, 404);

    // Assert : aucune réaction de l'intercepteur.
    expect(fauxAuthService.deconnexion).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(fauxErrorHandler.handleError).not.toHaveBeenCalled();
  });

  it('ne fait rien sur une réponse réussie', () => {
    // Arrange : on s'abonne à une requête réussie.
    let reponse: unknown;
    http.get(URL_PROTEGEE).subscribe((donnees) => (reponse = donnees));

    // Act : l'API répond 200 avec une liste vide.
    httpTesting.expectOne(URL_PROTEGEE).flush([]);

    // Assert : la réponse arrive telle quelle, sans aucune réaction de l'intercepteur.
    expect(reponse).toEqual([]);
    expect(fauxAuthService.deconnexion).not.toHaveBeenCalled();
    expect(fauxErrorHandler.handleError).not.toHaveBeenCalled();
  });

  it("laisse toujours l'erreur arriver jusqu'à l'appelant", () => {
    // Arrange : requête vers une route protégée.

    // Act : l'API répond 401 ; on récupère le statut reçu par l'appelant.
    const statutRecu = appelerEnErreur(URL_PROTEGEE, 401);

    // Assert : l'intercepteur n'a pas avalé l'erreur.
    expect(statutRecu).toBe(401);
  });
});
