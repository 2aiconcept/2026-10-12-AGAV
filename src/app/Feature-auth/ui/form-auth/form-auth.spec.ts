import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from '../../models/login';
import { Register } from '../../models/register';
import { FormAuth } from './form-auth';

describe('FormAuth', () => {
  let fixture: ComponentFixture<FormAuth>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAuth],
    }).compileComponents();

    fixture = TestBed.createComponent(FormAuth);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function champ(libelle: string): HTMLInputElement {
    const label = Array.from(element.querySelectorAll('label')).find(
      (l) => l.textContent?.trim() === libelle,
    );
    return element.querySelector(`#${label?.htmlFor}`) as HTMLInputElement;
  }

  function bouton(texte: string): HTMLButtonElement {
    return Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === texte,
    ) as HTMLButtonElement;
  }

  function saisir(libelle: string, valeur: string): void {
    const input = champ(libelle);
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function cliquer(texte: string): Promise<void> {
    bouton(texte).click();
    await fixture.whenStable();
  }

  describe('en mode connexion', () => {
    it("affiche l'e-mail et le mot de passe, sans prénom ni nom", () => {
      expect(champ('Adresse e-mail')).not.toBeNull();
      expect(champ('Mot de passe')).not.toBeNull();
      expect(champ('Prénom')).toBeNull();
      expect(champ('Nom')).toBeNull();
    });

    it("affiche les erreurs et n'émet rien si le formulaire est vide", async () => {
      let identifiants: Login | undefined;
      fixture.componentInstance.connexion.subscribe((valeur) => (identifiants = valeur));

      await cliquer('Se connecter');

      expect(element.textContent).toContain('Saisissez une adresse e-mail valide.');
      expect(champ('Adresse e-mail').getAttribute('aria-invalid')).toBe('true');
      expect(champ('Adresse e-mail').getAttribute('aria-describedby')).toBe('email-erreur');
      expect(identifiants).toBeUndefined();
    });

    it("signale un mot de passe trop court", async () => {
      saisir('Mot de passe', 'abc');
      await fixture.whenStable();

      expect(element.textContent).toContain("Saisissez un mot de passe d'au moins 6 caractères.");
    });

    it('émet connexion avec les identifiants saisis', async () => {
      let identifiants: Login | undefined;
      fixture.componentInstance.connexion.subscribe((valeur) => (identifiants = valeur));

      saisir('Adresse e-mail', 'user@test.com');
      saisir('Mot de passe', 'password123');
      await cliquer('Se connecter');

      expect(identifiants).toEqual({ email: 'user@test.com', password: 'password123' });
    });
  });

  describe('en mode inscription', () => {
    beforeEach(async () => {
      await cliquer('Créer un compte');
    });

    it('affiche aussi le prénom et le nom', () => {
      expect(champ('Prénom')).not.toBeNull();
      expect(champ('Nom')).not.toBeNull();
    });

    it("signale l'onglet actif avec aria-pressed", () => {
      const onglets = element.querySelector('[role="group"]')?.querySelectorAll('button') ?? [];

      expect(onglets[0].getAttribute('aria-pressed')).toBe('false');
      expect(onglets[1].getAttribute('aria-pressed')).toBe('true');
    });

    it('émet inscription avec toutes les informations saisies', async () => {
      let compte: Register | undefined;
      fixture.componentInstance.inscription.subscribe((valeur) => (compte = valeur));

      saisir('Prénom', 'Jean');
      saisir('Nom', 'Dupont');
      saisir('Adresse e-mail', 'jean.dupont@example.com');
      saisir('Mot de passe', 'motdepasse123');
      await cliquer('Créer mon compte');

      expect(compte).toEqual({
        email: 'jean.dupont@example.com',
        password: 'motdepasse123',
        nom: 'Dupont',
        prenom: 'Jean',
      });
    });

    it('revient en mode connexion avec le lien « Se connecter »', async () => {
      await cliquer('Se connecter');

      expect(champ('Prénom')).toBeNull();
      expect(bouton('Se connecter').type).toBe('submit');
    });
  });

  it('affiche ou masque le mot de passe', async () => {
    expect(champ('Mot de passe').type).toBe('password');

    await cliquer('Afficher le mot de passe');

    expect(champ('Mot de passe').type).toBe('text');
  });

  it("affiche l'erreur reçue du parent dans une alerte", async () => {
    fixture.componentRef.setInput('erreur', 'E-mail ou mot de passe incorrect.');
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'E-mail ou mot de passe incorrect.',
    );
  });

  it("désactive le bouton d'envoi pendant l'envoi", async () => {
    fixture.componentRef.setInput('isEnvoiEnCours', true);
    await fixture.whenStable();

    const envoi = element.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(envoi.disabled).toBe(true);
    expect(envoi.textContent).toContain('Envoi en cours');
  });
});
