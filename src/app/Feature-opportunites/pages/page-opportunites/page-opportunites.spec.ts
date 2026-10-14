/*
 * Ce qu'il faut tester : PageOpportunites (page de la liste des opportunités)
 *
 * - Pour l'instant, le composant est un squelette : son template n'affiche qu'un
 *   paragraphe « page-opportunites works! », sans donnée, sans action, sans service.
 * - Il n'y a donc aucun comportement à vérifier : on garde un seul test minimal, qui
 *   s'assure que le composant se crée sans erreur (template valide, dépendances présentes).
 * - Quand la fonctionnalité sera codée (liste, filtres par statut, chargement, erreur),
 *   on écrira ici les vrais tests, en remplaçant le service des opportunités par un faux.
 */

// ComponentFixture : type de la « poignée » sur le composant ; TestBed : l'environnement de test.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Les pages sont exportées par défaut (export default) pour le lazy loading : import sans accolades.
import PageOpportunites from './page-opportunites';

// describe regroupe les tests du composant PageOpportunites.
describe('PageOpportunites', () => {
  // La fixture, recréée avant chaque test.
  let fixture: ComponentFixture<PageOpportunites>;

  // beforeEach s'exécute avant chaque test : chaque test repart de zéro.
  beforeEach(async () => {
    // configureTestingModule déclare le composant standalone à tester.
    await TestBed.configureTestingModule({
      imports: [PageOpportunites],
      // compileComponents compile le template et les styles (asynchrone).
    }).compileComponents();

    // createComponent instancie le composant et renvoie sa fixture.
    fixture = TestBed.createComponent(PageOpportunites);
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
