/*
 * Ce qu'il faut tester : Logo (composant de présentation sans input)
 * -----------------------------------------------------------------
 * Le logo affiche la marque « liane », précédée d'une lettre dans un carré
 * et suivie d'un point coloré. On vérifie :
 * - le nom de la marque est affiché (c'est ce que lit un lecteur d'écran) ;
 * - la lettre et le point, purement décoratifs, sont masqués aux lecteurs
 *   d'écran (aria-hidden) : sinon on entendrait « l liane point ».
 * On ne teste PAS les couleurs ni les tailles (classes Bootstrap de mise en forme).
 *
 * Stratégie : TestBed crée le composant, whenStable() attend le rendu,
 * puis on lit le DOM.
 */

// Outils de test d'Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Le composant à tester.
import { Logo } from './logo';

describe('Logo', () => {
  // Recréés avant chaque test.
  let fixture: ComponentFixture<Logo>;
  let element: HTMLElement;

  beforeEach(async () => {
    // Le composant standalone est importé dans le module de test.
    await TestBed.configureTestingModule({
      imports: [Logo],
    }).compileComponents();

    // Création du composant, accès à son DOM, attente du rendu.
    fixture = TestBed.createComponent(Logo);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche le nom de la marque', () => {
    // Arrange : le logo est rendu dans le beforeEach.

    // Act : rien, on vérifie le rendu initial.

    // Assert : le texte de la marque est présent.
    expect(element.textContent).toContain('liane');
  });

  it("masque aux lecteurs d'écran la lettre et le point décoratifs", () => {
    // Arrange : le logo est rendu dans le beforeEach.

    // Act : on liste le texte de tous les éléments masqués (aria-hidden="true").
    const decoratifs = Array.from(element.querySelectorAll('[aria-hidden="true"]')).map(
      (decoratif) => decoratif.textContent?.trim(),
    );

    // Assert : toEqual() compare le contenu du tableau : exactement la lettre et le point.
    expect(decoratifs).toEqual(['l', '.']);
  });
});
