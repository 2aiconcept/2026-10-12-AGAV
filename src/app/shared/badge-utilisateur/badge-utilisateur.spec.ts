import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeUtilisateur } from './badge-utilisateur';

describe('BadgeUtilisateur', () => {
  let fixture: ComponentFixture<BadgeUtilisateur>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeUtilisateur],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeUtilisateur);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('utilisateur', { prenom: 'Chris', nom: 'Martin' });
    await fixture.whenStable();
  });

  it("affiche le prénom et le nom de l'utilisateur", () => {
    expect(element.textContent).toContain('Chris Martin');
  });

  it("affiche les initiales, masquées aux lecteurs d'écran", () => {
    const avatar = element.querySelector('[aria-hidden="true"]');

    expect(avatar?.textContent?.trim()).toBe('CM');
  });

  it("met à jour l'affichage quand l'utilisateur change", async () => {
    fixture.componentRef.setInput('utilisateur', { prenom: 'Alice', nom: 'Durand' });
    await fixture.whenStable();

    expect(element.textContent).toContain('Alice Durand');
    expect(element.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('AD');
  });
});
