import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../data-access/auth-service';
import { User } from '../../models/user';
import { FormAuth } from '../../ui/form-auth/form-auth';
import PageAuth from './page-auth';

describe('PageAuth', () => {
  let fixture: ComponentFixture<PageAuth>;
  let element: HTMLElement;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const session: User = {
    token: 'un-token-jwt',
    user: { id: 2, email: 'user@test.com', nom: 'Stagiaire', prenom: 'Angular', role: 'user' },
  };

  const fauxAuthService = {
    connexion: vi.fn<(...args: unknown[]) => Observable<User>>(),
    creerUnCompte: vi.fn<(...args: unknown[]) => Observable<User>>(),
  };

  beforeEach(async () => {
    fauxAuthService.connexion.mockReset();
    fauxAuthService.creerUnCompte.mockReset();

    await TestBed.configureTestingModule({
      imports: [PageAuth],
      providers: [provideRouter([]), { provide: AuthService, useValue: fauxAuthService }],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(PageAuth);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function formulaire(): FormAuth {
    return fixture.debugElement.query(By.directive(FormAuth)).componentInstance;
  }

  function erreurAffichee(): string | undefined {
    return element.querySelector('[role="alert"]')?.textContent?.trim();
  }

  it('affiche le titre principal et le formulaire', () => {
    expect(element.querySelector('h1')?.textContent).toContain('Vos entreprises');
    expect(element.querySelector('app-form-auth')).not.toBeNull();
  });

  it('connecte avec les identifiants saisis puis va sur les entreprises', async () => {
    fauxAuthService.connexion.mockReturnValue(of(session));

    formulaire().connexion.emit({ email: 'user@test.com', password: 'password123' });
    await fixture.whenStable();

    expect(fauxAuthService.connexion).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password123',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it('crée le compte avec les informations saisies puis va sur les entreprises', async () => {
    const compte = { email: 'jean@example.com', password: 'secret123', nom: 'Dupont', prenom: 'Jean' };
    fauxAuthService.creerUnCompte.mockReturnValue(of(session));

    formulaire().inscription.emit(compte);
    await fixture.whenStable();

    expect(fauxAuthService.creerUnCompte).toHaveBeenCalledWith(compte);
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it("affiche un message si les identifiants sont faux, sans changer de page", async () => {
    fauxAuthService.connexion.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    formulaire().connexion.emit({ email: 'user@test.com', password: 'mauvais' });
    await fixture.whenStable();

    expect(erreurAffichee()).toBe('E-mail ou mot de passe incorrect.');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("affiche le message de l'API pour une inscription refusée", async () => {
    fauxAuthService.creerUnCompte.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'Email deja utilise' } })),
    );

    formulaire().inscription.emit({ email: 'a@b.fr', password: 'secret123', nom: 'A', prenom: 'B' });
    await fixture.whenStable();

    expect(erreurAffichee()).toBe('Email deja utilise');
  });

  it("désactive le bouton d'envoi tant que l'API n'a pas répondu", async () => {
    const reponse = new Subject<User>();
    fauxAuthService.connexion.mockReturnValue(reponse);

    formulaire().connexion.emit({ email: 'user@test.com', password: 'password123' });
    await fixture.whenStable();

    const envoi = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(envoi.disabled).toBe(true);

    reponse.next(session);
    await fixture.whenStable();

    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });
});
