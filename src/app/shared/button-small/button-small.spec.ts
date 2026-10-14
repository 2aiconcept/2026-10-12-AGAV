/*
 * Ce qu'il faut tester : ButtonSmall (composant dumb)
 * ---------------------------------------------------
 * Un bouton réutilisable : il reçoit un libellé, une icône facultative, une
 * couleur Bootstrap, une taille et une option « contour », et émet `action` au clic.
 * On vérifie :
 * - le libellé est affiché dans un vrai <button> (accessible au clavier) ;
 * - l'icône n'apparaît que si on la fournit, devant le libellé, et masquée aux
 *   lecteurs d'écran (elle est décorative, le libellé suffit) ;
 * - la couleur et le style « plein » ou « contour » : ici, la classe Bootstrap
 *   (btn-primary, btn-outline-light…) EST le comportement attendu, c'est tout le
 *   rôle des inputs `couleur` et `isOutline`. Vérifier la classe est donc légitime ;
 * - la taille demandée (classe btn-sm, btn-lg…) ;
 * - les classes de forme (btn, rounded-pill) ne sont pas écrasées par la liaison
 *   [class] du template : c'est un piège réel quand on mélange class et [class] ;
 * - le clic émet l'output `action`.
 * On ne teste PAS le signal computed() interne : seulement son effet dans le DOM.
 *
 * Stratégie : TestBed + setInput() pour les inputs, whenStable() après chaque
 * changement, et un abonnement à l'output avec une fonction espion vi.fn().
 */

// Outils de test d'Angular : TestBed prépare l'environnement, ComponentFixture enveloppe le composant.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Le composant à tester.
import { ButtonSmall } from './button-small';

describe('ButtonSmall', () => {
  // Recréés avant chaque test pour garder des tests indépendants.
  let fixture: ComponentFixture<ButtonSmall>;
  let element: HTMLElement;

  beforeEach(async () => {
    // Le composant standalone est importé tel quel dans le module de test.
    await TestBed.configureTestingModule({
      imports: [ButtonSmall],
    }).compileComponents();

    // Création du composant et accès à son DOM.
    fixture = TestBed.createComponent(ButtonSmall);
    element = fixture.nativeElement;
    // `libelle` est un input requis : on le fournit avant le premier rendu.
    fixture.componentRef.setInput('libelle', 'Déconnexion');
    // Attente du rendu (zoneless : pas de détection automatique dans les tests).
    await fixture.whenStable();
  });

  // Petit raccourci de lecture : on cible le bouton par sa balise, c'est-à-dire son rôle « button ».
  function bouton(): HTMLButtonElement {
    return element.querySelector('button') as HTMLButtonElement;
  }

  // L'icône est le seul élément masqué aux lecteurs d'écran : c'est ce comportement qu'on vérifie.
  function icone(): Element | null {
    return bouton().querySelector('[aria-hidden="true"]');
  }

  it('affiche le libellé dans un bouton', () => {
    // Arrange : libellé « Déconnexion » fourni dans le beforeEach.

    // Act : rien, on vérifie le rendu initial.

    // Assert : trim() enlève les espaces et retours à la ligne du template.
    expect(bouton().textContent?.trim()).toBe('Déconnexion');
  });

  it("n'affiche pas d'icône par défaut", () => {
    // Arrange : aucune icône fournie.

    // Act : rien, rendu initial.

    // Assert : le bloc @if (icone()) n'a rien affiché.
    expect(icone()).toBeNull();
  });

  it("affiche l'icône devant le libellé, masquée aux lecteurs d'écran", async () => {
    // Arrange : rendu initial sans icône.

    // Act : on fournit une icône, puis on attend le nouveau rendu.
    fixture.componentRef.setInput('icone', '+');
    await fixture.whenStable();

    // Assert : l'icône est dans un élément aria-hidden…
    expect(icone()?.textContent).toBe('+');
    // … et elle précède le libellé (expression régulière : « + », des espaces, puis le libellé).
    expect(bouton().textContent?.trim()).toMatch(/^\+\s+Déconnexion$/);
  });

  it('a un fond plein de couleur primary par défaut', () => {
    // Arrange : aucune couleur fournie, la valeur par défaut de l'input s'applique.

    // Act : rien, rendu initial.

    // Assert : classList liste les classes CSS de l'élément.
    expect(bouton().classList).toContain('btn-primary');
  });

  it('a un fond plein de la couleur demandée', async () => {
    // Arrange : bouton primary par défaut.

    // Act : le parent demande la couleur « danger ».
    fixture.componentRef.setInput('couleur', 'danger');
    await fixture.whenStable();

    // Assert : la classe Bootstrap correspondante est appliquée.
    expect(bouton().classList).toContain('btn-danger');
  });

  it('a seulement un contour de la couleur demandée si isOutline est vrai', async () => {
    // Arrange : rendu initial plein.

    // Act : couleur « light » en style contour (comme le bouton Déconnexion du header).
    fixture.componentRef.setInput('couleur', 'light');
    fixture.componentRef.setInput('isOutline', true);
    await fixture.whenStable();

    // Assert : classe « outline », et surtout pas la version pleine.
    expect(bouton().classList).toContain('btn-outline-light');
    expect(bouton().classList).not.toContain('btn-light');
  });

  it('applique la taille demandée', async () => {
    // Arrange : rendu initial avec la taille par défaut.

    // Act : le parent demande un petit bouton.
    fixture.componentRef.setInput('btnSize', 'btn-sm');
    await fixture.whenStable();

    // Assert : la classe de taille est appliquée.
    expect(bouton().classList).toContain('btn-sm');
  });

  it('garde ses classes de forme quelle que soit la couleur', async () => {
    // Arrange : rendu initial.

    // Act : changement de couleur, donc recalcul de la liaison [class].
    fixture.componentRef.setInput('couleur', 'success');
    await fixture.whenStable();

    // Assert : les classes statiques du template n'ont pas été écrasées.
    expect(bouton().classList).toContain('btn');
    expect(bouton().classList).toContain('rounded-pill');
  });

  it('émet action quand on clique sur le bouton', () => {
    // Arrange : vi.fn() crée une fonction espion qui mémorise ses appels ;
    // on l'abonne à l'output comme le ferait (action)="..." dans un parent.
    const surAction = vi.fn();
    fixture.componentInstance.action.subscribe(surAction);

    // Act : click() simule le clic de l'utilisateur.
    bouton().click();

    // Assert : l'output a été émis exactement une fois.
    expect(surAction).toHaveBeenCalledTimes(1);
  });
});
