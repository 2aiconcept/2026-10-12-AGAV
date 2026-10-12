import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LayoutTopBottom } from './layout-top-bottom';

@Component({
  imports: [LayoutTopBottom],
  template: `
    <app-layout-top-bottom>
      <p slotStart>Contenu du haut</p>
      <p slotEnd>Contenu du bas</p>
      <p>Contenu sans slot</p>
    </app-layout-top-bottom>
  `,
})
class PageHote {}

describe('LayoutTopBottom', () => {
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
    expect(texteDuSlot('slotStart')).toBe('Contenu du haut');
  });

  it('affiche le contenu projeté dans slotEnd', () => {
    expect(texteDuSlot('slotEnd')).toBe('Contenu du bas');
  });

  it('place slotStart avant slotEnd', () => {
    const textes = Array.from(element.querySelectorAll('p')).map((p) => p.textContent?.trim());

    expect(textes).toEqual(['Contenu du haut', 'Contenu du bas']);
  });

  it("n'affiche pas un contenu sans attribut de slot", () => {
    expect(element.textContent).not.toContain('Contenu sans slot');
  });
});
