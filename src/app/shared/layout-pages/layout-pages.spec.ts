/*
 * Ce qu'il faut tester : LayoutPages (mise en page par projection de contenu)
 * --------------------------------------------------------------------------
 * LayoutPages ne fait qu'une chose : placer le contenu reçu dans quatre zones,
 * grâce à <ng-content select="...">. On vérifie :
 * - chaque contenu projeté est bien affiché (en-tête, barre d'outils, contenu
 *   principal sans attribut, pied de page) ;
 * - chaque contenu arrive dans SA zone : les zones s'affichent toujours dans
 *   l'ordre en-tête, barre d'outils, contenu, pied de page, même si le parent
 *   écrit son contenu dans un autre ordre.
 * On ne teste PAS les classes Bootstrap (card, shadow…) : c'est du style.
 *
 * Stratégie : un composant qui utilise <ng-content> ne se teste pas seul (il
 * n'aurait rien à projeter). On écrit un petit composant hôte de test qui
 * l'utilise comme le ferait une vraie page, puis on crée cet hôte avec TestBed.
 */

// Component : pour déclarer le composant hôte propre au test.
import { Component } from '@angular/core';
// TestBed : crée le composant hôte dans un environnement Angular de test.
import { TestBed } from '@angular/core/testing';
// Le composant à tester.
import { LayoutPages } from './layout-pages';

// Composant hôte : les contenus sont volontairement écrits dans le DÉSORDRE,
// pour prouver que c'est bien LayoutPages qui les range dans la bonne zone.
@Component({
  imports: [LayoutPages],
  template: `
    <app-layout-pages>
      <p pageFooter>Pied de page</p>
      <p>Contenu principal</p>
      <p pageToolbar>Barre d'outils</p>
      <p pageHeader>En-tête</p>
    </app-layout-pages>
  `,
})
class PageHote {}

describe('LayoutPages', () => {
  // L'élément DOM de l'hôte, recréé avant chaque test.
  let element: HTMLElement;

  beforeEach(async () => {
    // Un composant standalone peut être créé sans configureTestingModule :
    // ses imports (ici LayoutPages) suffisent.
    const fixture = TestBed.createComponent(PageHote);
    // Accès au DOM rendu de l'hôte (qui contient LayoutPages).
    element = fixture.nativeElement;
    // Attente du rendu (zoneless).
    await fixture.whenStable();
  });

  it('affiche le contenu de chaque emplacement', () => {
    // Arrange : l'hôte projette quatre contenus (voir le template ci-dessus).

    // Act : rien, on vérifie le rendu initial.

    // Assert : aucun contenu n'est perdu, y compris celui sans attribut (ng-content par défaut).
    expect(element.textContent).toContain('En-tête');
    expect(element.textContent).toContain("Barre d'outils");
    expect(element.textContent).toContain('Contenu principal');
    expect(element.textContent).toContain('Pied de page');
  });

  it("place les emplacements dans l'ordre en-tête, barre d'outils, contenu, pied de page", () => {
    // Arrange : l'hôte écrit ses contenus dans le désordre.

    // Act : querySelectorAll() renvoie les paragraphes dans l'ordre où ils apparaissent dans le DOM rendu.
    const textes = Array.from(element.querySelectorAll('p')).map((p) => p.textContent?.trim());

    // Assert : l'ordre est celui des zones de LayoutPages, pas celui de l'hôte.
    expect(textes).toEqual(['En-tête', "Barre d'outils", 'Contenu principal', 'Pied de page']);
  });
});
