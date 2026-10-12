import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LayoutPages } from './layout-pages';

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
  let element: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(PageHote);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche le contenu de chaque emplacement', () => {
    expect(element.textContent).toContain('En-tête');
    expect(element.textContent).toContain("Barre d'outils");
    expect(element.textContent).toContain('Contenu principal');
    expect(element.textContent).toContain('Pied de page');
  });

  it("place les emplacements dans l'ordre en-tête, barre d'outils, contenu, pied de page", () => {
    const textes = Array.from(element.querySelectorAll('p')).map((p) => p.textContent?.trim());

    expect(textes).toEqual(['En-tête', "Barre d'outils", 'Contenu principal', 'Pied de page']);
  });
});
