/*
 * Ce qu'il faut tester dans authGuard
 * -----------------------------------
 * Un guard `canActivate` répond à une seule question : « l'utilisateur a-t-il le droit d'entrer
 * sur cette route ? ». Son comportement visible, c'est donc uniquement sa valeur de retour :
 *  - avec une session ouverte, il renvoie `true` : la navigation continue ;
 *  - sans session, il renvoie un `UrlTree` vers `/connexion` : le routeur redirige l'utilisateur
 *    vers la page de connexion au lieu d'afficher la page protégée.
 * On ne teste PAS la façon dont il s'y prend (quels services il injecte, dans quel ordre) :
 * seulement « ce qui entre » (une session ou pas) et « ce qui sort » (true ou une redirection).
 *
 * Stratégie
 * ---------
 *  - Le guard est une simple fonction qui utilise `inject()` : il doit être exécuté dans un
 *    « contexte d'injection ». `TestBed.runInInjectionContext()` nous en fournit un.
 *  - On remplace le vrai AuthService par un faux qui expose seulement un signal `session` :
 *    pas de HTTP, pas de localStorage, et on choisit la situation de chaque test.
 *  - `provideRouter([])` fournit un vrai Router (sans routes) pour construire et lire l'UrlTree.
 */

// TestBed : l'outil d'Angular qui crée un mini-environnement d'application pour les tests.
import { TestBed } from '@angular/core/testing';
// signal : pour donner au faux service un signal `session`, comme le vrai.
import { signal } from '@angular/core';
// Types et outils du routeur : les paramètres du guard, le Router et la classe UrlTree.
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
// Le vrai service, utilisé ici seulement comme « jeton » à remplacer par notre faux.
import { AuthService } from './auth-service';
// Le type de la session, pour typer le signal du faux service.
import { User } from '../models/user';
// Le guard testé : c'est le code réel, pas une copie.
import { authGuard } from './auth-guard';

// describe regroupe tous les tests qui concernent authGuard.
describe('authGuard', () => {
  // Une session d'exemple, telle que l'API la renvoie après une connexion réussie.
  const session: User = {
    token: 'un-token-jwt',
    user: { id: 2, email: 'user@test.com', nom: 'Stagiaire', prenom: 'Angular', role: 'user' },
  };

  // Configure TestBed avec un faux AuthService dont la session vaut la valeur demandée.
  function configurer(sessionCourante: User | null): void {
    // Le faux service : juste un signal `session`, la seule chose que le guard lit.
    const fauxAuthService = { session: signal<User | null>(sessionCourante) };
    // On déclare les dépendances disponibles dans ce mini-environnement.
    TestBed.configureTestingModule({
      providers: [
        // Un vrai Router (sans routes) : le guard s'en sert pour créer l'UrlTree de redirection.
        provideRouter([]),
        // « Quand quelqu'un demande AuthService, donne-lui notre faux objet à la place. »
        { provide: AuthService, useValue: fauxAuthService },
      ],
    });
  }

  // Appelle le guard comme le ferait le routeur, mais dans le contexte d'injection de TestBed.
  function executerGuard(): ReturnType<typeof authGuard> {
    // Le guard n'utilise pas ces deux paramètres : des objets vides typés suffisent.
    const route = {} as ActivatedRouteSnapshot;
    const etat = {} as RouterStateSnapshot;
    // Sans runInInjectionContext, les inject() du guard lèveraient une erreur.
    return TestBed.runInInjectionContext(() => authGuard(route, etat));
  }

  it('laisse passer quand une session est ouverte', () => {
    // Arrange : l'utilisateur est connecté.
    configurer(session);

    // Act : le routeur interroge le guard.
    const resultat = executerGuard();

    // Assert : true veut dire « navigation autorisée ».
    expect(resultat).toBe(true);
  });

  it("redirige vers /connexion quand il n'y a pas de session", () => {
    // Arrange : personne n'est connecté.
    configurer(null);
    // On récupère le Router de TestBed pour fabriquer l'URL attendue et lire le résultat.
    const router = TestBed.inject(Router);

    // Act : le routeur interroge le guard.
    const resultat = executerGuard();

    // Assert : le guard renvoie bien un UrlTree (une redirection), pas true ni false…
    expect(resultat).toBeInstanceOf(UrlTree);
    // … et cet UrlTree, converti en texte, correspond à l'URL /connexion.
    expect(router.serializeUrl(resultat as UrlTree)).toBe(
      router.serializeUrl(router.parseUrl('/connexion')),
    );
  });
});
