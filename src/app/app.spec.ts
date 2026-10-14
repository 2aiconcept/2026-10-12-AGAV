/*
 * Ce qu'il faut tester : App (composant racine, sélecteur app-root)
 *
 * - App est le premier composant affiché par Angular (bootstrapApplication dans main.ts).
 *   Son seul rôle aujourd'hui : afficher <router-outlet>, l'emplacement où le routeur
 *   insère la page correspondant à l'URL.
 * - On vérifie donc deux comportements :
 *   1. le composant se crée sans erreur (ses dépendances sont satisfaites) ;
 *   2. il affiche bien un <router-outlet> (sans lui, aucune page ne s'afficherait).
 * - Stratégie : <router-outlet> a besoin du routeur (il injecte ActivatedRoute, Router…).
 *   On fournit donc provideRouter([]) : un routeur avec une liste de routes vide,
 *   suffisante pour que le composant fonctionne sans charger les vraies pages.
 * - On ne teste pas le contenu des pages : chacune a son propre fichier de test.
 */

// TestBed : l'outil d'Angular qui prépare un mini-environnement de test (injection, composants).
import { TestBed } from '@angular/core/testing';
// provideRouter : fournit le routeur d'Angular, indispensable à <router-outlet>.
import { provideRouter } from '@angular/router';
// Le composant à tester.
import { App } from './app';

// describe regroupe tous les tests qui concernent le composant App.
describe('App', () => {
  // beforeEach s'exécute avant CHAQUE test : chaque test repart d'un environnement neuf.
  beforeEach(async () => {
    // configureTestingModule déclare ce dont le test a besoin.
    await TestBed.configureTestingModule({
      // imports : le composant standalone à tester (il apporte ses propres dépendances).
      imports: [App],
      // providers : les services à fournir ; ici un routeur sans aucune route.
      providers: [provideRouter([])],
      // compileComponents compile le template et le CSS du composant (opération asynchrone).
    }).compileComponents();
  });

  it('se crée sans erreur', () => {
    // Arrange : createComponent instancie App et renvoie une « fixture »,
    // une poignée qui donne accès au composant et à son rendu HTML.
    const fixture = TestBed.createComponent(App);

    // Act : componentInstance récupère l'instance de la classe App créée par Angular.
    const app = fixture.componentInstance;

    // Assert : toBeTruthy vérifie que la valeur existe (ni null, ni undefined).
    expect(app).toBeTruthy();
  });

  it('affiche un router-outlet pour accueillir les pages', async () => {
    // Arrange : on crée le composant.
    const fixture = TestBed.createComponent(App);

    // Act : whenStable attend que le rendu soit terminé (application zoneless,
    // pas de détection automatique : on attend explicitement qu'Angular ait fini).
    await fixture.whenStable();
    // nativeElement est l'élément HTML réel du composant ; on le type en HTMLElement.
    const element = fixture.nativeElement as HTMLElement;

    // Assert : querySelector cherche <router-outlet> ; not.toBeNull() vérifie qu'il est trouvé.
    expect(element.querySelector('router-outlet')).not.toBeNull();
  });
});
