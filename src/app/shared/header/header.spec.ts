import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it("affiche un en-tête de page", () => {
    expect(element.querySelector('header')).not.toBeNull();
  });

  it('affiche un logo qui mène à la liste des entreprises', () => {
    const logo = element.querySelector('a');

    expect(logo?.getAttribute('href')).toBe('/entreprises');
    expect(logo?.textContent).toContain('liane');
  });

  it('affiche un menu avec un lien vers chaque page principale', () => {
    const nav = element.querySelector('nav[aria-label="Navigation principale"]');
    const liens = Array.from(nav?.querySelectorAll('a') ?? []).map((a) => [
      a.textContent?.trim(),
      a.getAttribute('href'),
    ]);

    expect(liens).toEqual([
      ['Entreprises', '/entreprises'],
      ['Contacts', '/contacts'],
      ['Opportunités', '/opportunites'],
    ]);
  });

  it('signale le lien de la page courante avec aria-current', async () => {
    await TestBed.inject(Router).navigateByUrl('/contacts');
    await fixture.whenStable();

    const lienActif = element.querySelector('nav a[aria-current="page"]');

    expect(lienActif?.textContent?.trim()).toBe('Contacts');
  });

  it("affiche le nom et le rôle de l'utilisateur", () => {
    expect(element.textContent).toContain('Chris Martin');
    expect(element.textContent).toContain('Commercial');
  });

  it('affiche un bouton de déconnexion', () => {
    const bouton = Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Déconnexion',
    );

    expect(bouton).toBeDefined();
  });
});
