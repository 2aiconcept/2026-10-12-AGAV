/*
 * Ce qu'il faut tester : LayoutSlice (mise en page en deux colonnes)
 * -----------------------------------------------------------------
 * LayoutSlice place le contenu reçu dans deux zones, gauche et droite, grâce à
 * <ng-content select="[slotStart]"> et <ng-content select="[slotEnd]">.
 * On vérifie :
 * - le contenu marqué slotStart et celui marqué slotEnd sont affichés ;
 * - slotStart est toujours placé avant slotEnd, même si le parent les écrit
 *   dans l'autre ordre (c'est le composant qui range, pas le parent) ;
 * - un contenu sans attribut de slot n'est pas affiché : il n'y a pas de
 *   <ng-content> par défaut, Angular ne le projette nulle part.
 * On ne teste PAS les colonnes Bootstrap (col-md-6…) : c'est du style.
 *
 * Stratégie : un composant hôte de test utilise LayoutSlice et lui projette
 * du contenu, comme le ferait la vraie page de connexion.
 */

// Component : pour déclarer le composant hôte du test.
import { Component } from '@angular/core';
// TestBed : crée le composant hôte dans un environnement Angular de test.
import { TestBed } from '@angular/core/testing';
// Le composant à tester.
import { LayoutSlice } from './layout-slice';

// Hôte de test : slotEnd est écrit AVANT slotStart, pour prouver que c'est
// LayoutSlice qui remet les zones dans le bon ordre.
@Component({
  imports: [LayoutSlice],
  template: `
    <app-layout-slice>
      <p slotEnd>Contenu de droite</p>
      <p slotStart>Contenu de gauche</p>
      <p>Contenu sans slot</p>
    </app-layout-slice>
  `,
})
class PageHote {}

describe('LayoutSlice', () => {
  // DOM de l'hôte, recréé avant chaque test.
  let element: HTMLElement;

  beforeEach(async () => {
    // Composant standalone : createComponent() suffit, sans configureTestingModule.
    const fixture = TestBed.createComponent(PageHote);
    // Accès au DOM rendu.
    element = fixture.nativeElement;
    // Attente du rendu (zoneless).
    await fixture.whenStable();
  });

  // Textes des paragraphes affichés, dans l'ordre du DOM rendu.
  function textesAffiches(): (string | undefined)[] {
    return Array.from(element.querySelectorAll('p')).map((p) => p.textContent?.trim());
  }

  it('affiche le contenu projeté dans slotStart', () => {
    // Arrange : l'hôte projette « Contenu de gauche » dans slotStart.

    // Act : rien, rendu initial.

    // Assert : le texte est affiché.
    expect(element.textContent).toContain('Contenu de gauche');
  });

  it('affiche le contenu projeté dans slotEnd', () => {
    // Arrange : l'hôte projette « Contenu de droite » dans slotEnd.

    // Act : rien, rendu initial.

    // Assert : le texte est affiché.
    expect(element.textContent).toContain('Contenu de droite');
  });

  it("place slotStart avant slotEnd, quel que soit l'ordre du parent", () => {
    // Arrange : l'hôte écrit slotEnd en premier.

    // Act : lecture des textes dans l'ordre du DOM rendu.
    const textes = textesAffiches();

    // Assert : gauche puis droite ; le contenu sans slot n'apparaît pas du tout.
    expect(textes).toEqual(['Contenu de gauche', 'Contenu de droite']);
  });

  it("n'affiche pas un contenu sans attribut de slot", () => {
    // Arrange : l'hôte projette un paragraphe sans slotStart ni slotEnd.

    // Act : rien, rendu initial.

    // Assert : sans <ng-content> par défaut, ce contenu est ignoré.
    expect(element.textContent).not.toContain('Contenu sans slot');
  });
});
