/*
 * Ce qu'il faut tester : Header (en-tête de l'application)
 * --------------------------------------------------------
 * Le header assemble le logo (lien vers les entreprises), le menu de navigation
 * et, si quelqu'un est connecté, le badge utilisateur et le bouton
 * « Déconnexion ». On vérifie ce que voit et fait l'utilisateur :
 * - un en-tête de page (<header>, rôle « banner ») est affiché ;
 * - le logo est un lien vers /entreprises ;
 * - le menu de navigation principale est présent ;
 * - AVEC une session : le nom et les initiales de l'utilisateur, et le bouton
 *   « Déconnexion » ; un clic déconnecte puis redirige vers /connexion ;
 * - SANS session : ni utilisateur ni bouton, et ils apparaissent dès qu'une
 *   session arrive (le template réagit au signal `session`).
 * On ne teste PAS le détail des composants enfants (logo, nav, badge, bouton) :
 * chacun a son propre fichier de test. On vérifie seulement qu'ils sont branchés.
 *
 * Stratégie :
 * - le vrai AuthService ferait du HTTP et lirait le localStorage : on le
 *   remplace par un FAUX service (useValue) avec un signal `session` qu'on
 *   pilote nous-mêmes, et une fonction espion vi.fn() pour `deconnexion` ;
 * - routerLink a besoin du Router : provideRouter([]) suffit ;
 * - on espionne Router.navigateByUrl avec vi.spyOn() pour vérifier la
 *   redirection sans vraiment naviguer.
 */

// signal / WritableSignal : pour créer la fausse session, modifiable dans les tests.
import { signal, WritableSignal } from '@angular/core';
// Outils de test d'Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// provideRouter : fournit le routeur ; Router : le service qu'on va espionner.
import { provideRouter, Router } from '@angular/router';
// Le service à remplacer par un faux (on importe la classe pour s'en servir comme jeton d'injection).
import { AuthService } from '../../Feature-auth/data-access/auth-service';
// Le type de la session, pour typer nos données de test.
import { User } from '../../Feature-auth/models/user';
// Le composant à tester.
import { Header } from './header';

describe('Header', () => {
  // Recréés avant chaque test : aucun état partagé entre deux tests.
  let fixture: ComponentFixture<Header>;
  let element: HTMLElement;
  let session: WritableSignal<User | null>;
  let fauxAuthService: { session: WritableSignal<User | null>; deconnexion: () => void };

  // Donnée de test : une session connectée (constante, jamais modifiée).
  const sessionChris: User = {
    token: 'un-token-jwt',
    user: { id: 1, email: 'chris@test.com', nom: 'Martin', prenom: 'Chris', role: 'user' },
  };

  beforeEach(async () => {
    // Par défaut, quelqu'un est connecté.
    session = signal<User | null>(sessionChris);
    // Le faux service imite le vrai : la déconnexion vide la session.
    fauxAuthService = { session, deconnexion: vi.fn(() => session.set(null)) };

    await TestBed.configureTestingModule({
      // Le composant standalone (ses enfants Logo, Nav… sont importés avec lui).
      imports: [Header],
      providers: [
        // Un routeur sans route : suffisant pour routerLink.
        provideRouter([]),
        // Quand le Header demande AuthService, Angular lui donne notre faux.
        { provide: AuthService, useValue: fauxAuthService },
      ],
    }).compileComponents();

    // Création du composant, accès au DOM, attente du rendu.
    fixture = TestBed.createComponent(Header);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  // Trouve le bouton par son texte visible, comme le ferait l'utilisateur.
  function boutonDeconnexion(): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find(
      (bouton) => bouton.textContent?.trim() === 'Déconnexion',
    );
  }

  // Trouve un lien par son texte visible.
  function lienContenant(texte: string): HTMLAnchorElement | undefined {
    return Array.from(element.querySelectorAll('a')).find((lien) =>
      lien.textContent?.includes(texte),
    );
  }

  it('affiche un en-tête de page', () => {
    // Arrange : le header est rendu dans le beforeEach.

    // Act : on cherche l'élément sémantique <header>.
    const enTete = element.querySelector('header');

    // Assert : il existe (un lecteur d'écran l'annonce comme « bannière »).
    expect(enTete).not.toBeNull();
  });

  it('affiche un logo qui mène à la liste des entreprises', () => {
    // Arrange : le header est rendu dans le beforeEach.

    // Act : on cherche le lien qui contient le nom de la marque.
    const logo = lienContenant('liane');

    // Assert : routerLink a généré le href vers les entreprises.
    expect(logo?.getAttribute('href')).toBe('/entreprises');
  });

  it('affiche le menu de navigation principale', () => {
    // Arrange : le header est rendu dans le beforeEach.

    // Act : on cherche la navigation par son nom accessible.
    const nav = element.querySelector('nav[aria-label="Navigation principale"]');

    // Assert : le composant Nav est bien branché dans le header.
    expect(nav).not.toBeNull();
  });

  // describe() imbriqué : regroupe les tests qui partent d'une même situation.
  describe('avec une session', () => {
    it("affiche le nom et les initiales de l'utilisateur connecté", () => {
      // Arrange : la session de Chris Martin est active (beforeEach).

      // Act : rien, rendu initial.

      // Assert : le badge utilisateur reçoit bien l'utilisateur de la session.
      expect(element.textContent).toContain('Chris Martin');
      expect(element.textContent).toContain('CM');
    });

    it('affiche un bouton de déconnexion', () => {
      // Arrange : session active.

      // Act : on cherche le bouton par son texte.
      const bouton = boutonDeconnexion();

      // Assert : le bouton est présent.
      expect(bouton).toBeDefined();
    });

    it('déconnecte et va sur la page de connexion au clic sur « Déconnexion »', async () => {
      // Arrange : vi.spyOn() remplace navigateByUrl par un espion ;
      // mockResolvedValue(true) lui fait renvoyer une promesse résolue, sans vraie navigation.
      const navigateByUrl = vi
        .spyOn(TestBed.inject(Router), 'navigateByUrl')
        .mockResolvedValue(true);

      // Act : l'utilisateur clique, puis on attend le nouveau rendu.
      boutonDeconnexion()?.click();
      await fixture.whenStable();

      // Assert : le service a été appelé et la redirection demandée.
      expect(fauxAuthService.deconnexion).toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/connexion');
    });
  });

  describe('sans session', () => {
    // Ce beforeEach s'exécute APRÈS celui du describe parent : on part de la
    // session connectée, puis on la vide.
    beforeEach(async () => {
      session.set(null);
      await fixture.whenStable();
    });

    it("n'affiche ni l'utilisateur ni le bouton de déconnexion", () => {
      // Arrange : session vide (beforeEach ci-dessus).

      // Act : rien, on vérifie le rendu.

      // Assert : le bloc @if (session) n'affiche rien.
      expect(element.textContent).not.toContain('Chris Martin');
      expect(boutonDeconnexion()).toBeUndefined();
    });

    it("affiche l'utilisateur dès qu'une session arrive", async () => {
      // Arrange : session vide.

      // Act : une session arrive (comme après une connexion), puis on attend le rendu.
      session.set(sessionChris);
      await fixture.whenStable();

      // Assert : le template a réagi au changement du signal.
      expect(element.textContent).toContain('Chris Martin');
      expect(boutonDeconnexion()).toBeDefined();
    });
  });
});
