import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LayoutSlice } from './layout-slice';

@Component({
  imports: [LayoutSlice],
  template: `
    <app-layout-slice>
      <p slotStart>Contenu de gauche</p>
      <p slotEnd>Contenu de droite</p>
      <p>Contenu sans slot</p>
    </app-layout-slice>
  `,
})
class PageHote {}

describe('LayoutSlice', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(PageHote);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function texteDuSlot(slot: string): string | undefined {
    return element.querySelector(`[${slot}]`)?.textContent?.trim();
  }

  it('affiche le contenu projeté dans slotStart', () => {
    expect(texteDuSlot('slotStart')).toBe('Contenu de gauche');
  });

  it('affiche le contenu projeté dans slotEnd', () => {
    expect(texteDuSlot('slotEnd')).toBe('Contenu de droite');
  });

  it('place slotStart avant slotEnd', () => {
    const textes = Array.from(element.querySelectorAll('p')).map((p) => p.textContent?.trim());

    expect(textes).toEqual(['Contenu de gauche', 'Contenu de droite']);
  });

  it("n'affiche pas un contenu sans attribut de slot", () => {
    expect(element.textContent).not.toContain('Contenu sans slot');
  });
});
