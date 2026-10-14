/*
 * Ce qu'il faut tester dans PageAuth (composant smart, page routée)
 * -----------------------------------------------------------------
 * La page orchestre : elle reçoit les événements du formulaire (composant dumb FormAuth), appelle
 * AuthService, puis navigue ou affiche une erreur. Ses comportements visibles sont :
 *  - elle affiche le titre principal et le formulaire ;
 *  - quand le formulaire émet `connexion` ou `inscription`, elle appelle la bonne méthode du
 *    service avec les données reçues, puis va sur /entreprises en cas de succès ;
 *  - en cas d'erreur, elle affiche un message compréhensible (selon le statut HTTP) et reste
 *    sur la page ;
 *  - pendant l'envoi, le bouton d'envoi est désactivé ; il redevient actif après la réponse.
 * On ne teste PAS l'implémentation interne (la propriété `envoi$`, les opérateurs RxJS, la
 * fonction `messageErreur`) : seulement ce qui s'affiche et ce qui est appelé.
 * Le détail du formulaire (validation, champs…) est déjà testé dans form-auth.spec.ts.
 *
 * Stratégie
 * ---------
 *  - On remplace AuthService par un faux (`useValue`) dont les méthodes sont des espions
 *    `vi.fn()` : on choisit ce qu'elles renvoient (`of` = succès, `throwError` = erreur,
 *    `Subject` = réponse qui n'arrive pas encore) et on vérifie comment elles ont été appelées.
 *  - On espionne `Router.navigateByUrl` pour vérifier la navigation sans vraiment naviguer.
 *  - On simule l'action de l'utilisateur en faisant émettre l'output du formulaire enfant :
 *    c'est exactement ce que la page reçoit dans la vraie application.
 */

// ComponentFixture : l'enveloppe de test d'un composant ; TestBed : le mini-environnement Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Le type des erreurs HTTP, pour simuler une réponse en erreur de l'API.
import { HttpErrorResponse } from '@angular/common/http';
// By : utilitaire pour retrouver un composant enfant dans l'arbre de rendu.
import { By } from '@angular/platform-browser';
// provideRouter fournit un Router de test ; Router est la classe qu'on espionne.
import { provideRouter, Router } from '@angular/router';
// Outils RxJS pour fabriquer les réponses du faux service.
import { Observable, of, Subject, throwError } from 'rxjs';
// Types Vitest : Mock = une fonction espion créée par vi.fn(), MockInstance = un espion vi.spyOn().
import type { Mock, MockInstance } from 'vitest';
// Le vrai service, utilisé comme « jeton » à remplacer par le faux.
import { AuthService } from '../../data-access/auth-service';
// Les types des données échangées.
import { Login } from '../../models/login';
import { Register } from '../../models/register';
import { User } from '../../models/user';
// Le formulaire enfant, pour le retrouver et faire émettre ses outputs.
import { FormAuth } from '../../ui/form-auth/form-auth';
// La page testée (export par défaut, pour le lazy loading).
import PageAuth from './page-auth';

// Le type du faux service : seulement les méthodes que la page utilise, sous forme d'espions.
interface FauxAuthService {
  connexion: Mock<(identifiants: Login) => Observable<User>>;
  creerUnCompte: Mock<(compte: Register) => Observable<User>>;
}

// describe regroupe tous les tests de la page.
describe('PageAuth', () => {
  // La fixture et l'élément HTML rendu, recréés avant chaque test.
  let fixture: ComponentFixture<PageAuth>;
  let element: HTMLElement;
  // Le faux service et l'espion de navigation, recréés à chaque test (aucun état partagé).
  let fauxAuthService: FauxAuthService;
  let navigateByUrl: MockInstance<Router['navigateByUrl']>;

  // Les identifiants et le compte que le formulaire est censé émettre.
  const identifiants: Login = { email: 'user@test.com', password: 'password123' };
  const compte: Register = {
    email: 'jean@example.com',
    password: 'secret123',
    nom: 'Dupont',
    prenom: 'Jean',
  };

  // La session renvoyée par l'API en cas de succès.
  const session: User = {
    token: 'un-token-jwt',
    user: { id: 2, email: 'user@test.com', nom: 'Stagiaire', prenom: 'Angular', role: 'user' },
  };

  beforeEach(async () => {
    // Un faux service neuf pour chaque test : vi.fn() crée une fonction espion vide.
    fauxAuthService = { connexion: vi.fn(), creerUnCompte: vi.fn() };

    // On déclare le composant testé et les dépendances dont il a besoin.
    await TestBed.configureTestingModule({
      // La page est standalone : on l'importe directement.
      imports: [PageAuth],
      providers: [
        // Un Router de test, sans routes.
        provideRouter([]),
        // « Quand la page demande AuthService, donne-lui le faux. »
        { provide: AuthService, useValue: fauxAuthService },
      ],
    }).compileComponents();

    // On espionne navigateByUrl et on remplace son effet par une promesse résolue : pas de vraie
    // navigation, mais on pourra vérifier qu'elle a été demandée.
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    // On crée la page et on récupère son élément HTML.
    fixture = TestBed.createComponent(PageAuth);
    element = fixture.nativeElement;
    // Zoneless : on attend que le premier rendu soit terminé.
    await fixture.whenStable();
  });

  // Retrouve l'instance du formulaire enfant, pour faire émettre ses outputs.
  function formulaire(): FormAuth {
    return fixture.debugElement.query(By.directive(FormAuth)).componentInstance;
  }

  // Lit le message d'erreur affiché, repéré par son rôle ARIA « alert ».
  function erreurAffichee(): string | undefined {
    return element.querySelector('[role="alert"]')?.textContent?.trim();
  }

  // Retrouve un bouton par son texte visible (comme le ferait l'utilisateur).
  function bouton(texte: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(texte),
    );
  }

  it('affiche le titre principal et le formulaire de connexion', () => {
    // Arrange : la page est déjà affichée (beforeEach).

    // Act : rien, on vérifie l'affichage initial.

    // Assert : le titre de niveau 1 et le bouton d'envoi du formulaire sont présents.
    expect(element.querySelector('h1')?.textContent).toContain('Vos entreprises');
    expect(bouton('Se connecter')).toBeDefined();
  });

  it('connecte avec les identifiants saisis puis va sur les entreprises', async () => {
    // Arrange : l'API acceptera la connexion (of émet la session puis se termine).
    fauxAuthService.connexion.mockReturnValue(of(session));

    // Act : le formulaire émet les identifiants, puis on attend la fin du rendu.
    formulaire().connexion.emit(identifiants);
    await fixture.whenStable();

    // Assert : le service a reçu les identifiants et la page navigue vers les entreprises.
    expect(fauxAuthService.connexion).toHaveBeenCalledWith(identifiants);
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it('crée le compte avec les informations saisies puis va sur les entreprises', async () => {
    // Arrange : l'API acceptera l'inscription.
    fauxAuthService.creerUnCompte.mockReturnValue(of(session));

    // Act : le formulaire émet les informations du compte.
    formulaire().inscription.emit(compte);
    await fixture.whenStable();

    // Assert : le service a reçu le compte et la page navigue vers les entreprises.
    expect(fauxAuthService.creerUnCompte).toHaveBeenCalledWith(compte);
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it('affiche un message si les identifiants sont faux, sans changer de page', async () => {
    // Arrange : l'API répondra 401 (throwError crée un observable qui échoue).
    fauxAuthService.connexion.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    // Act : le formulaire émet des identifiants.
    formulaire().connexion.emit({ email: 'user@test.com', password: 'mauvais' });
    await fixture.whenStable();

    // Assert : un message clair s'affiche et aucune navigation n'a eu lieu.
    expect(erreurAffichee()).toBe('E-mail ou mot de passe incorrect.');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("affiche le message de l'API pour une inscription refusée", async () => {
    // Arrange : l'API répondra 400 avec son propre message dans le corps de l'erreur.
    fauxAuthService.creerUnCompte.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { error: 'Email deja utilise' } }),
      ),
    );

    // Act : le formulaire émet le compte.
    formulaire().inscription.emit(compte);
    await fixture.whenStable();

    // Assert : c'est le message de l'API qui s'affiche.
    expect(erreurAffichee()).toBe('Email deja utilise');
  });

  it('affiche un message si le serveur est injoignable', async () => {
    // Arrange : statut 0 = la requête n'a pas pu atteindre le serveur (réseau coupé…).
    fauxAuthService.connexion.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    // Act : le formulaire émet des identifiants.
    formulaire().connexion.emit(identifiants);
    await fixture.whenStable();

    // Assert : le message invite à vérifier la connexion.
    expect(erreurAffichee()).toBe(
      'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
    );
  });

  it('affiche un message générique pour une autre erreur du serveur', async () => {
    // Arrange : l'API répondra 500 (erreur interne).
    fauxAuthService.connexion.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    // Act : le formulaire émet des identifiants.
    formulaire().connexion.emit(identifiants);
    await fixture.whenStable();

    // Assert : un message générique s'affiche.
    expect(erreurAffichee()).toBe('Une erreur est survenue. Réessayez plus tard.');
  });

  it("désactive le bouton d'envoi tant que l'API n'a pas répondu", async () => {
    // Arrange : un Subject est un observable qui n'émet que quand on appelle next() :
    // il simule une réponse de l'API qui n'est pas encore arrivée.
    const reponse = new Subject<User>();
    fauxAuthService.connexion.mockReturnValue(reponse);

    // Act : le formulaire émet, la requête est « en cours ».
    formulaire().connexion.emit(identifiants);
    await fixture.whenStable();

    // Assert : le bouton indique l'envoi en cours et il est désactivé.
    expect(bouton('Envoi en cours')?.disabled).toBe(true);

    // Act : l'API répond enfin.
    reponse.next(session);
    await fixture.whenStable();

    // Assert : la page navigue et le bouton redevient utilisable.
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
    expect(bouton('Se connecter')?.disabled).toBe(false);
  });
});
