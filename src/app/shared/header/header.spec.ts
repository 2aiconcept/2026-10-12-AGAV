import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../Feature-auth/data-access/auth-service';
import { User } from '../../Feature-auth/models/user';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let element: HTMLElement;
  let session: BehaviorSubject<User | null>;
  let fauxAuthService: { session$: BehaviorSubject<User | null>; deconnexion: () => void };

  const sessionChris: User = {
    token: 'un-token-jwt',
    user: { id: 1, email: 'chris@test.com', nom: 'Martin', prenom: 'Chris', role: 'user' },
  };

  beforeEach(async () => {
    session = new BehaviorSubject<User | null>(sessionChris);
    fauxAuthService = { session$: session, deconnexion: vi.fn(() => session.next(null)) };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: AuthService, useValue: fauxAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function boutonDeconnexion(): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Déconnexion',
    );
  }

  it('affiche un en-tête de page', () => {
    expect(element.querySelector('header')).not.toBeNull();
  });

  it('affiche un logo qui mène à la liste des entreprises', () => {
    const logo = element.querySelector('a');

    expect(logo?.getAttribute('href')).toBe('/entreprises');
    expect(logo?.textContent).toContain('liane');
  });

  it('affiche le menu de navigation principale', () => {
    expect(element.querySelector('nav[aria-label="Navigation principale"]')).not.toBeNull();
  });

  describe('avec une session', () => {
    it("affiche le nom et les initiales de l'utilisateur connecté", () => {
      expect(element.textContent).toContain('Chris Martin');
      expect(element.textContent).toContain('CM');
    });

    it('affiche un bouton de déconnexion', () => {
      expect(boutonDeconnexion()).toBeDefined();
    });

    it('déconnecte et va sur la page de connexion au clic sur « Déconnexion »', async () => {
      const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

      boutonDeconnexion()?.click();
      await fixture.whenStable();

      expect(fauxAuthService.deconnexion).toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/connexion');
    });
  });

  describe('sans session', () => {
    beforeEach(async () => {
      session.next(null);
      await fixture.whenStable();
    });

    it("n'affiche ni l'utilisateur ni le bouton de déconnexion", () => {
      expect(element.textContent).not.toContain('Chris Martin');
      expect(boutonDeconnexion()).toBeUndefined();
    });

    it("affiche l'utilisateur dès qu'une session arrive", async () => {
      session.next(sessionChris);
      await fixture.whenStable();

      expect(element.textContent).toContain('Chris Martin');
      expect(boutonDeconnexion()).toBeDefined();
    });
  });
});
