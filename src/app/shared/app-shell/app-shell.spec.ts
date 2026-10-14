/*
 * Ce qu'il faut tester : AppShell (la coquille commune des pages connectées)
 *
 * - AppShell affiche le header (<app-header />) puis un <main> qui contient <router-outlet>,
 *   où le routeur insère la page demandée (entreprises, opportunités…).
 * - Comportements à vérifier :
 *   1. le composant se crée ;
 *   2. le header (balise sémantique <header>, rôle « banner ») est affiché ;
 *   3. le contenu des pages est placé dans un <main> (rôle « main ») : c'est le repère
 *      qui permet aux lecteurs d'écran d'aller directement au contenu principal.
 * - Stratégie :
 *   - provideRouter([]) : <router-outlet> et les liens du header (routerLink) ont besoin du
 *     routeur, sinon Angular lève « No provider found for ActivatedRoute ».
 *   - Faux AuthService : le Header injecte AuthService (qui fait du HTTP et lit le
 *     localStorage). On le remplace par un faux objet minimal pour tester AppShell
 *     isolément, sans dépendre du vrai service.
 */

// signal : pour créer un faux signal session() identique à celui du vrai service.
import { signal } from '@angular/core';
// ComponentFixture : le type de la « poignée » sur le composant testé ; TestBed : l'environnement de test.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// provideRouter : fournit le routeur, nécessaire à <router-outlet> et à routerLink.
import { provideRouter } from '@angular/router';
// Le vrai service, utilisé seulement comme « jeton » pour le remplacer par un faux.
import { AuthService } from '../../Feature-auth/data-access/auth-service';
// Le composant à tester.
import { AppShell } from './app-shell';

// describe regroupe les tests du composant AppShell.
describe('AppShell', () => {
  // La fixture est partagée par les tests ; elle est recréée dans chaque beforeEach.
  let fixture: ComponentFixture<AppShell>;

  // beforeEach s'exécute avant chaque test : environnement neuf, aucun état partagé.
  beforeEach(async () => {
    // Faux AuthService : session à null (personne de connecté), deconnexion espionnée par vi.fn().
    const fauxAuthService = { session: signal(null), deconnexion: vi.fn() };

    // configureTestingModule déclare le composant et les services nécessaires au test.
    await TestBed.configureTestingModule({
      // Le composant standalone à tester.
      imports: [AppShell],
      providers: [
        // Un routeur sans route : suffisant pour afficher <router-outlet> et les liens.
        provideRouter([]),
        // Quand quelqu'un demande AuthService, Angular donne notre faux objet (useValue).
        { provide: AuthService, useValue: fauxAuthService },
      ],
      // compileComponents compile les templates et les styles (asynchrone).
    }).compileComponents();

    // createComponent instancie AppShell et renvoie sa fixture.
    fixture = TestBed.createComponent(AppShell);
    // whenStable attend la fin du rendu (zoneless : pas de détection automatique).
    await fixture.whenStable();
  });

  it('se crée sans erreur', () => {
    // Arrange : le composant a été créé dans le beforeEach.
    // Act : componentInstance récupère l'instance de la classe AppShell.
    const composant = fixture.componentInstance;

    // Assert : l'instance existe.
    expect(composant).toBeTruthy();
  });

  it("affiche le header de l'application", () => {
    // Arrange : nativeElement donne accès au HTML rendu du composant.
    const element = fixture.nativeElement as HTMLElement;

    // Act : on cherche la balise sémantique <header> rendue par le composant Header.
    const header = element.querySelector('header');

    // Assert : le header est présent dans la page.
    expect(header).not.toBeNull();
  });

  it('place le contenu des pages dans un <main> (repère accessibilité)', () => {
    // Arrange : on récupère le HTML rendu.
    const element = fixture.nativeElement as HTMLElement;

    // Act : on cherche le <main>, puis le <router-outlet> à l'intérieur du <main>.
    const main = element.querySelector('main');
    const routerOutletDansMain = element.querySelector('main router-outlet');

    // Assert : le <main> existe et c'est bien lui qui contient l'emplacement des pages.
    expect(main).not.toBeNull();
    expect(routerOutletDansMain).not.toBeNull();
  });
});
