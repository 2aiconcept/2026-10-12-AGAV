import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Nav } from './nav';

@Component({ template: '' })
class PageVide {}

describe('Nav', () => {
  let fixture: ComponentFixture<Nav>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nav],
      providers: [
        provideRouter([
          { path: 'entreprises', component: PageVide },
          { path: 'contacts', component: PageVide },
          { path: 'opportunites', component: PageVide },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Nav);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function lien(texte: string): HTMLAnchorElement | undefined {
    return Array.from(element.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === texte,
    );
  }

  it('affiche une navigation principale nommée', () => {
    const nav = element.querySelector('nav');

    expect(nav?.getAttribute('aria-label')).toBe('Navigation principale');
  });

  it('affiche un lien vers chaque page principale', () => {
    expect(lien('Entreprises')?.getAttribute('href')).toBe('/entreprises');
    expect(lien('Contacts')?.getAttribute('href')).toBe('/contacts');
    expect(lien('Opportunités')?.getAttribute('href')).toBe('/opportunites');
  });

  it('signale le lien de la page courante avec aria-current', async () => {
    await TestBed.inject(Router).navigateByUrl('/contacts');
    await fixture.whenStable();

    expect(lien('Contacts')?.getAttribute('aria-current')).toBe('page');
    expect(lien('Entreprises')?.hasAttribute('aria-current')).toBe(false);
  });
});
