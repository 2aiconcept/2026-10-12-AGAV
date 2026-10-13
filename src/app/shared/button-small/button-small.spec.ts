import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonSmall } from './button-small';

describe('ButtonSmall', () => {
  let fixture: ComponentFixture<ButtonSmall>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonSmall],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonSmall);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('libelle', 'Déconnexion');
    await fixture.whenStable();
  });

  function bouton(): HTMLButtonElement {
    return element.querySelector('button') as HTMLButtonElement;
  }

  it('affiche le libellé dans un bouton', () => {
    expect(bouton().textContent?.trim()).toBe('Déconnexion');
  });

  it("n'affiche pas d'icône par défaut", () => {
    expect(bouton().querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("affiche l'icône devant le libellé, masquée aux lecteurs d'écran", async () => {
    fixture.componentRef.setInput('icone', '+');
    await fixture.whenStable();

    const icone = bouton().querySelector('[aria-hidden="true"]');

    expect(icone?.textContent).toBe('+');
    expect(bouton().textContent?.trim()).toMatch(/^\+\s+Déconnexion$/);
  });

  it('a un fond plein de couleur primary par défaut', () => {
    expect(bouton().classList).toContain('btn-primary');
  });

  it('a un fond plein de la couleur demandée', async () => {
    fixture.componentRef.setInput('couleur', 'danger');
    await fixture.whenStable();

    expect(bouton().classList).toContain('btn-danger');
  });

  it('a seulement un contour de la couleur demandée si isOutline est vrai', async () => {
    fixture.componentRef.setInput('couleur', 'light');
    fixture.componentRef.setInput('isOutline', true);
    await fixture.whenStable();

    expect(bouton().classList).toContain('btn-outline-light');
    expect(bouton().classList).not.toContain('btn-light');
  });

  it('garde ses classes de forme quelle que soit la couleur', async () => {
    fixture.componentRef.setInput('couleur', 'success');
    await fixture.whenStable();

    expect(bouton().classList).toContain('btn');
    expect(bouton().classList).toContain('rounded-pill');
  });

  it('émet action quand on clique sur le bouton', () => {
    let nombreDActions = 0;
    fixture.componentInstance.action.subscribe(() => nombreDActions++);

    bouton().click();

    expect(nombreDActions).toBe(1);
  });
});
