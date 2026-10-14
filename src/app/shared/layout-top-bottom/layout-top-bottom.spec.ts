/*
 * Ce qu'il faut tester : LayoutTopBottom (mise en page en deux zones empilées)
 * ---------------------------------------------------------------------------
 * LayoutTopBottom place le contenu reçu dans deux zones, haut et bas, grâce à
 * <ng-content select="[slotStart]"> et <ng-content select="[slotEnd]">.
 * On vérifie :
 * - le contenu marqué slotStart et celui marqué slotEnd sont affichés ;
 * - slotStart (haut) est toujours placé avant slotEnd (bas), même si le parent
 *   les écrit dans l'autre ordre ;
 * - un contenu sans attribut de slot n'est pas affiché (pas de <ng-content>
 *   par défaut).
 * On ne teste PAS les hauteurs ni les couleurs (classes Bootstrap h-50, bg-dark…).
 *
 * Stratégie : un composant hôte de test utilise LayoutTopBottom et lui
 * projette du contenu, comme le ferait une vraie page.
 */

// Component : pour déclarer le composant hôte du test.
import { Component } from '@angular/core';
// TestBed : crée le composant hôte dans un environnement Angular de test.
import { TestBed } from '@angular/core/testing';
// Le composant à tester.
import { LayoutTopBottom } from './layout-top-bottom';

// Hôte de test : slotEnd est écrit AVANT slotStart, pour prouver que c'est
// LayoutTopBottom qui remet les zones dans le bon ordre.
@Component({
  imports: [LayoutTopBottom],
  template: `
    <app-layout-top-bottom>
      <p slotEnd>Contenu du bas</p>
      <p slotStart>Contenu du haut</p>
      <p>Contenu sans slot</p>
    </app-layout-top-bottom>
  `,
})
class PageHote {}

describe('LayoutTopBottom', () => {
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
    // Arrange : l'hôte projette « Contenu du haut » dans slotStart.

    // Act : rien, rendu initial.

    // Assert : le texte est affiché.
    expect(element.textContent).toContain('Contenu du haut');
  });

  it('affiche le contenu projeté dans slotEnd', () => {
    // Arrange : l'hôte projette « Contenu du bas » dans slotEnd.

    // Act : rien, rendu initial.

    // Assert : le texte est affiché.
    expect(element.textContent).toContain('Contenu du bas');
  });

  it("place slotStart avant slotEnd, quel que soit l'ordre du parent", () => {
    // Arrange : l'hôte écrit slotEnd en premier.

    // Act : lecture des textes dans l'ordre du DOM rendu.
    const textes = textesAffiches();

    // Assert : haut puis bas ; le contenu sans slot n'apparaît pas du tout.
    expect(textes).toEqual(['Contenu du haut', 'Contenu du bas']);
  });

  it("n'affiche pas un contenu sans attribut de slot", () => {
    // Arrange : l'hôte projette un paragraphe sans slotStart ni slotEnd.

    // Act : rien, rendu initial.

    // Assert : sans <ng-content> par défaut, ce contenu est ignoré.
    expect(element.textContent).not.toContain('Contenu sans slot');
  });
});
