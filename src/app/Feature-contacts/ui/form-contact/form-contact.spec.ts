/*
 * Ce qu'il faut tester : FormContact (composant de présentation « dumb » du formulaire contact)
 *
 * - Pour l'instant, le composant est un squelette : son template n'affiche qu'un
 *   paragraphe « form-contact works! », sans input(), sans output(), sans champ.
 * - Il n'y a donc aucun comportement à vérifier : on garde un seul test minimal, qui
 *   s'assure que le composant se crée sans erreur (template valide).
 * - Quand le formulaire sera codé, on testera comme pour tout composant dumb : on fixe les
 *   entrées avec fixture.componentRef.setInput(), on vérifie les champs affichés (par leur
 *   libellé), les messages d'erreur et l'output() émis à la soumission.
 */

// ComponentFixture : type de la « poignée » sur le composant ; TestBed : l'environnement de test.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Un composant dumb est exporté nommément : import avec accolades.
import { FormContact } from './form-contact';

// describe regroupe les tests du composant FormContact.
describe('FormContact', () => {
  // La fixture, recréée avant chaque test.
  let fixture: ComponentFixture<FormContact>;

  // beforeEach s'exécute avant chaque test : chaque test repart de zéro.
  beforeEach(async () => {
    // configureTestingModule déclare le composant standalone à tester.
    await TestBed.configureTestingModule({
      imports: [FormContact],
      // compileComponents compile le template et les styles (asynchrone).
    }).compileComponents();

    // createComponent instancie le composant et renvoie sa fixture.
    fixture = TestBed.createComponent(FormContact);
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
