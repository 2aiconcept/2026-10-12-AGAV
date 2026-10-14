/*
 * Ce qu'il faut tester : PageNotFound (page affichée quand l'URL ne correspond à aucune route)
 *
 * - Pour l'instant, le composant est un squelette : son template n'affiche qu'un
 *   paragraphe « page-not-found works! », sans message utile ni lien de retour.
 * - Il n'y a donc aucun comportement à vérifier : on garde un seul test minimal, qui
 *   s'assure que le composant se crée sans erreur (template valide, dépendances présentes).
 * - Quand la page sera codée, on vérifiera le titre affiché et la présence d'un lien
 *   (rôle « link ») pour revenir à l'accueil ; il faudra alors fournir provideRouter([]).
 */

// ComponentFixture : type de la « poignée » sur le composant ; TestBed : l'environnement de test.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Les pages sont exportées par défaut (export default) pour le lazy loading : import sans accolades.
import PageNotFound from './page-not-found';

// describe regroupe les tests du composant PageNotFound.
describe('PageNotFound', () => {
  // La fixture, recréée avant chaque test.
  let fixture: ComponentFixture<PageNotFound>;

  // beforeEach s'exécute avant chaque test : chaque test repart de zéro.
  beforeEach(async () => {
    // configureTestingModule déclare le composant standalone à tester.
    await TestBed.configureTestingModule({
      imports: [PageNotFound],
      // compileComponents compile le template et les styles (asynchrone).
    }).compileComponents();

    // createComponent instancie le composant et renvoie sa fixture.
    fixture = TestBed.createComponent(PageNotFound);
    // whenStable attend la fin du rendu (zoneless : pas de détection automatique).
    await fixture.whenStable();
  });

  it('se crée sans erreur', () => {
    // Arrange : le composant a été créé dans le beforeEach.
    // Act : componentInstance récupère l'instance de la classe du composant.
    const composant = fixture.componentInstance;

    // Assert : toBeTruthy vérifie que l'instance existe (ni null, ni undefined).
    expect(composant).toBeTruthy();
  });
});
