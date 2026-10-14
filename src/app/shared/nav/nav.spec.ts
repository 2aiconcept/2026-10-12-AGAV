/*
 * Ce qu'il faut tester : Nav (menu de navigation principale)
 * ---------------------------------------------------------
 * Nav affiche trois liens (Entreprises, Contacts, Opportunités) avec
 * routerLink, et signale la page courante avec routerLinkActive. On vérifie :
 * - la navigation a un nom accessible (aria-label), utile quand une page
 *   contient plusieurs <nav> ;
 * - chaque lien mène à la bonne URL (attribut href généré par routerLink) ;
 * - le lien de la page courante porte aria-current="page" (c'est ainsi qu'un
 *   lecteur d'écran annonce « page actuelle »), et les autres non.
 * On ne teste PAS les classes visuelles du lien actif (bg-white, fw-semibold) :
 * aria-current suffit à prouver que routerLinkActive fonctionne.
 *
 * Stratégie : routerLink a besoin du Router. On fournit un vrai routeur de test
 * avec provideRouter() et trois routes vers une page vide, puis on navigue
 * avec Router.navigateByUrl() pour simuler l'arrivée sur une page.
 */

// Component : pour déclarer une page vide servant de cible aux routes de test.
import { Component } from '@angular/core';
// Outils de test d'Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// provideRouter : fournit le routeur ; Router : le service qui permet de naviguer.
import { provideRouter, Router } from '@angular/router';
// Le composant à tester.
import { Nav } from './nav';

// Page vide : les routes de test ont besoin d'un composant, peu importe lequel.
@Component({ template: '' })
class PageVide {}

describe('Nav', () => {
  // Recréés avant chaque test.
  let fixture: ComponentFixture<Nav>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Le composant standalone à tester.
      imports: [Nav],
      // Un vrai routeur avec les trois routes vers lesquelles pointent les liens.
      providers: [
        provideRouter([
          { path: 'entreprises', component: PageVide },
          { path: 'contacts', component: PageVide },
          { path: 'opportunites', component: PageVide },
        ]),
      ],
    }).compileComponents();

    // Création du composant, accès au DOM, attente du rendu.
    fixture = TestBed.createComponent(Nav);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  // Trouve un lien par son texte visible, comme le ferait l'utilisateur (pas par classe CSS).
  function lien(texte: string): HTMLAnchorElement | undefined {
    return Array.from(element.querySelectorAll('a')).find((a) => a.textContent?.trim() === texte);
  }

  it('affiche une navigation principale nommée', () => {
    // Arrange : le menu est rendu dans le beforeEach.

    // Act : on cherche l'élément <nav> (rôle « navigation »).
    const nav = element.querySelector('nav');

    // Assert : son nom accessible est « Navigation principale ».
    expect(nav?.getAttribute('aria-label')).toBe('Navigation principale');
  });

  it('affiche un lien vers chaque page principale', () => {
    // Arrange : le menu est rendu dans le beforeEach.

    // Act : rien, rendu initial.

    // Assert : routerLink a généré le bon href pour chaque lien.
    expect(lien('Entreprises')?.getAttribute('href')).toBe('/entreprises');
    expect(lien('Contacts')?.getAttribute('href')).toBe('/contacts');
    expect(lien('Opportunités')?.getAttribute('href')).toBe('/opportunites');
  });

  it('signale le lien de la page courante avec aria-current', async () => {
    // Arrange : TestBed.inject() récupère le Router fourni par provideRouter().
    const router = TestBed.inject(Router);

    // Act : on navigue vers /contacts (navigateByUrl renvoie une promesse), puis on attend le rendu.
    await router.navigateByUrl('/contacts');
    await fixture.whenStable();

    // Assert : seul le lien Contacts est marqué comme page courante.
    expect(lien('Contacts')?.getAttribute('aria-current')).toBe('page');
    expect(lien('Entreprises')?.hasAttribute('aria-current')).toBe(false);
    expect(lien('Opportunités')?.hasAttribute('aria-current')).toBe(false);
  });
});
