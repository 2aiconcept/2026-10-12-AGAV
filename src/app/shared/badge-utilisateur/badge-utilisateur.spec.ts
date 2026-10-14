/*
 * Ce qu'il faut tester : BadgeUtilisateur (composant dumb)
 * --------------------------------------------------------
 * Le badge reçoit un utilisateur via input() et affiche son avatar (initiales)
 * et son nom complet. On vérifie ce que voit l'utilisateur :
 * - le prénom et le nom sont affichés ;
 * - les initiales sont affichées dans l'avatar, masquées aux lecteurs d'écran
 *   (aria-hidden) car elles répètent le nom : sinon le nom serait lu deux fois ;
 * - l'affichage suit le changement de l'input (le composant réagit au signal).
 * On ne teste PAS le calcul détaillé des initiales (c'est le rôle de
 * initiales-pipe.spec.ts) ni les classes Bootstrap de mise en forme.
 *
 * Stratégie : un composant dumb n'a aucun service. On le crée avec TestBed,
 * on fixe son input avec fixture.componentRef.setInput(), puis on attend
 * le rendu avec fixture.whenStable() (application zoneless).
 */

// ComponentFixture : l'enveloppe de test autour du composant créé.
// TestBed : le « mini-module » Angular qui prépare l'environnement de test.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Le composant à tester.
import { BadgeUtilisateur } from './badge-utilisateur';

describe('BadgeUtilisateur', () => {
  // La fixture et l'élément DOM sont recréés avant chaque test (pas d'état partagé).
  let fixture: ComponentFixture<BadgeUtilisateur>;
  let element: HTMLElement;

  // beforeEach() s'exécute avant CHAQUE test : chaque test part d'un composant neuf.
  beforeEach(async () => {
    // Un composant standalone s'importe directement dans le module de test.
    await TestBed.configureTestingModule({
      imports: [BadgeUtilisateur],
    }).compileComponents();

    // createComponent() instancie le composant et son template.
    fixture = TestBed.createComponent(BadgeUtilisateur);
    // nativeElement : l'élément HTML racine du composant, pour lire le DOM rendu.
    element = fixture.nativeElement;
    // setInput() donne une valeur à l'input requis, comme le ferait le parent.
    fixture.componentRef.setInput('utilisateur', { prenom: 'Chris', nom: 'Martin' });
    // whenStable() attend la fin du rendu (indispensable en zoneless).
    await fixture.whenStable();
  });

  // Les initiales sont dans l'élément décoratif masqué aux lecteurs d'écran :
  // c'est précisément ce comportement d'accessibilité qu'on veut vérifier.
  function avatar(): Element | null {
    return element.querySelector('[aria-hidden="true"]');
  }

  it("affiche le prénom et le nom de l'utilisateur", () => {
    // Arrange : l'utilisateur Chris Martin est déjà fourni dans le beforeEach.

    // Act : rien à faire, on vérifie le rendu initial.

    // Assert : textContent contient tout le texte visible du composant.
    expect(element.textContent).toContain('Chris Martin');
  });

  it("affiche les initiales dans l'avatar, masqué aux lecteurs d'écran", () => {
    // Arrange : l'utilisateur Chris Martin est déjà fourni dans le beforeEach.

    // Act : on récupère l'avatar masqué (aria-hidden="true").
    const initiales = avatar()?.textContent?.trim();

    // Assert : l'élément masqué contient bien les initiales.
    expect(initiales).toBe('CM');
  });

  it("met à jour l'affichage quand l'utilisateur change", async () => {
    // Arrange : le badge affiche Chris Martin.

    // Act : le parent fournit un autre utilisateur, puis on attend le nouveau rendu.
    fixture.componentRef.setInput('utilisateur', { prenom: 'Alice', nom: 'Durand' });
    await fixture.whenStable();

    // Assert : le nom et les initiales ont suivi le nouvel input.
    expect(element.textContent).toContain('Alice Durand');
    expect(avatar()?.textContent?.trim()).toBe('AD');
  });
});
