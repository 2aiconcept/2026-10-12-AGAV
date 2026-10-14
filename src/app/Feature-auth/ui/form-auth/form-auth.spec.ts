/*
 * Ce qu'il faut tester dans FormAuth (composant dumb, de présentation)
 * --------------------------------------------------------------------
 * Le formulaire ne connaît ni service ni API : il affiche des champs, valide la saisie et émet
 * des événements. Ses comportements visibles sont :
 *  - en mode connexion : e-mail + mot de passe ; en mode inscription : prénom et nom en plus ;
 *  - on passe d'un mode à l'autre par les onglets ou le lien du bas, l'onglet actif est signalé
 *    aux technologies d'assistance par `aria-pressed` ;
 *  - une saisie invalide affiche un message d'erreur relié au champ (`aria-invalid`,
 *    `aria-describedby`) et rien n'est émis ;
 *  - une saisie valide émet `connexion` (e-mail, mot de passe) ou `inscription` (avec prénom
 *    et nom) ;
 *  - le bouton « Afficher / Masquer » change la visibilité du mot de passe ;
 *  - les inputs venant du parent sont respectés : `erreur` s'affiche dans une alerte,
 *    `isEnvoiEnCours` désactive le bouton d'envoi.
 * On ne teste PAS l'implémentation (le FormGroup, les signals `mode` ou `isConnexion`) :
 * on agit et on vérifie comme un utilisateur, à travers le HTML rendu.
 *
 * Stratégie
 * ---------
 *  - Aucun faux service à fournir : un composant dumb n'injecte rien de métier.
 *  - On retrouve les éléments par leur libellé (`<label>`) ou leur texte, jamais par classe CSS.
 *  - On simule la saisie en changeant la valeur du champ puis en déclenchant les événements
 *    `input` (le formulaire lit la valeur) et `blur` (le champ devient « touché »).
 *  - Les outputs sont écoutés avec un espion `vi.fn()`.
 *  - Les inputs sont fixés avec `fixture.componentRef.setInput()`, comme le ferait le parent.
 *  - Zoneless : après chaque action, `await fixture.whenStable()` attend la mise à jour du rendu.
 */

// ComponentFixture : l'enveloppe de test du composant ; TestBed : le mini-environnement Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Le composant testé.
import { FormAuth } from './form-auth';

// describe regroupe tous les tests du formulaire.
describe('FormAuth', () => {
  // La fixture et l'élément HTML rendu, recréés avant chaque test.
  let fixture: ComponentFixture<FormAuth>;
  let element: HTMLElement;

  beforeEach(async () => {
    // Le composant est standalone : on l'importe tel quel, sans autre dépendance à fournir.
    await TestBed.configureTestingModule({
      imports: [FormAuth],
    }).compileComponents();

    // On crée le composant et on récupère son élément HTML racine.
    fixture = TestBed.createComponent(FormAuth);
    element = fixture.nativeElement;
    // On attend le premier rendu (zoneless : rien n'est automatique dans un test).
    await fixture.whenStable();
  });

  // Texte visible d'un élément, espaces et retours à la ligne ramenés à un seul espace.
  function texte(el: Element): string {
    return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  // Retrouve un champ par le texte de son <label>, via l'attribut for (lien label → champ).
  // Renvoie null si le libellé n'est pas affiché.
  function champ(libelle: string): HTMLInputElement | null {
    const label = Array.from(element.querySelectorAll('label')).find((l) => texte(l) === libelle);
    return label ? element.querySelector<HTMLInputElement>(`#${label.htmlFor}`) : null;
  }

  // Retrouve le premier bouton dont le texte visible correspond exactement.
  function bouton(libelle: string): HTMLButtonElement {
    const trouve = Array.from(element.querySelectorAll('button')).find((b) => texte(b) === libelle);
    // Si le bouton n'existe pas, on échoue avec un message clair plutôt qu'une erreur obscure.
    if (!trouve) {
      throw new Error(`Bouton « ${libelle} » introuvable`);
    }
    return trouve;
  }

  // Retrouve un onglet (Connexion / Créer un compte) dans le groupe nommé « Type de formulaire ».
  function onglet(libelle: string): HTMLButtonElement | undefined {
    const groupe = element.querySelector('[role="group"][aria-label="Type de formulaire"]');
    return Array.from(groupe?.querySelectorAll('button') ?? []).find((b) => texte(b) === libelle);
  }

  // Simule la saisie d'un utilisateur dans un champ, puis sa sortie du champ.
  function saisir(libelle: string, valeur: string): void {
    const input = champ(libelle);
    // Si le champ n'existe pas, on le signale clairement.
    if (!input) {
      throw new Error(`Champ « ${libelle} » introuvable`);
    }
    // On change la valeur, puis on prévient Angular avec l'événement input.
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
    // blur : l'utilisateur quitte le champ, qui devient « touché » (les erreurs peuvent s'afficher).
    input.dispatchEvent(new Event('blur'));
  }

  // Clique sur un bouton puis attend la mise à jour de l'affichage.
  async function cliquer(libelle: string): Promise<void> {
    bouton(libelle).click();
    await fixture.whenStable();
  }

  describe('en mode connexion', () => {
    it("affiche l'e-mail et le mot de passe, sans prénom ni nom", () => {
      // Arrange : le formulaire démarre en mode connexion (beforeEach).

      // Act : rien, on vérifie l'affichage initial.

      // Assert : seuls l'e-mail et le mot de passe sont présents.
      expect(champ('Adresse e-mail')).not.toBeNull();
      expect(champ('Mot de passe')).not.toBeNull();
      expect(champ('Prénom')).toBeNull();
      expect(champ('Nom')).toBeNull();
    });

    it("signale l'onglet Connexion comme actif avec aria-pressed", () => {
      // Arrange : mode connexion par défaut.

      // Act : rien, on vérifie l'état initial des onglets.

      // Assert : seul l'onglet Connexion est « enfoncé ».
      expect(onglet('Connexion')?.getAttribute('aria-pressed')).toBe('true');
      expect(onglet('Créer un compte')?.getAttribute('aria-pressed')).toBe('false');
    });

    it("affiche les erreurs et n'émet rien si le formulaire est vide", async () => {
      // Arrange : un espion écoute l'output connexion.
      const espionConnexion = vi.fn();
      fixture.componentInstance.connexion.subscribe(espionConnexion);

      // Act : l'utilisateur envoie le formulaire vide.
      await cliquer('Se connecter');

      // Assert : le message d'erreur s'affiche…
      expect(element.textContent).toContain('Saisissez une adresse e-mail valide.');
      // … le champ est signalé invalide et relié à son message, pour les lecteurs d'écran…
      expect(champ('Adresse e-mail')?.getAttribute('aria-invalid')).toBe('true');
      expect(champ('Adresse e-mail')?.getAttribute('aria-describedby')).toBe('email-erreur');
      // … et rien n'a été émis vers le parent.
      expect(espionConnexion).not.toHaveBeenCalled();
    });

    it('signale un mot de passe trop court', async () => {
      // Arrange : rien de plus à préparer.

      // Act : l'utilisateur saisit un mot de passe de 3 caractères puis quitte le champ.
      saisir('Mot de passe', 'abc');
      await fixture.whenStable();

      // Assert : le message indique la longueur minimale et le champ est marqué invalide.
      expect(element.textContent).toContain("Saisissez un mot de passe d'au moins 6 caractères.");
      expect(champ('Mot de passe')?.getAttribute('aria-invalid')).toBe('true');
    });

    it('émet connexion avec les identifiants saisis', async () => {
      // Arrange : un espion écoute l'output, l'utilisateur remplit les champs.
      const espionConnexion = vi.fn();
      fixture.componentInstance.connexion.subscribe(espionConnexion);
      saisir('Adresse e-mail', 'user@test.com');
      saisir('Mot de passe', 'password123');

      // Act : il envoie le formulaire.
      await cliquer('Se connecter');

      // Assert : l'output a émis une seule fois, avec l'e-mail et le mot de passe seulement.
      expect(espionConnexion).toHaveBeenCalledExactlyOnceWith({
        email: 'user@test.com',
        password: 'password123',
      });
    });
  });

  describe('en mode inscription', () => {
    // Avant chaque test de ce groupe, on passe en mode inscription par l'onglet.
    beforeEach(async () => {
      await cliquer('Créer un compte');
    });

    it('affiche aussi le prénom et le nom', () => {
      // Arrange : mode inscription (beforeEach).

      // Act : rien, on vérifie l'affichage.

      // Assert : les deux champs supplémentaires apparaissent.
      expect(champ('Prénom')).not.toBeNull();
      expect(champ('Nom')).not.toBeNull();
    });

    it("signale l'onglet Créer un compte comme actif avec aria-pressed", () => {
      // Arrange : mode inscription (beforeEach).

      // Act : rien, on vérifie l'état des onglets.

      // Assert : l'état aria-pressed a basculé d'un onglet à l'autre.
      expect(onglet('Connexion')?.getAttribute('aria-pressed')).toBe('false');
      expect(onglet('Créer un compte')?.getAttribute('aria-pressed')).toBe('true');
    });

    it("affiche les erreurs du prénom et du nom et n'émet rien s'ils sont vides", async () => {
      // Arrange : un espion écoute l'output inscription ; e-mail et mot de passe sont valides.
      const espionInscription = vi.fn();
      fixture.componentInstance.inscription.subscribe(espionInscription);
      saisir('Adresse e-mail', 'jean.dupont@example.com');
      saisir('Mot de passe', 'motdepasse123');

      // Act : l'utilisateur envoie sans prénom ni nom.
      await cliquer('Créer mon compte');

      // Assert : les deux messages s'affichent et rien n'est émis.
      expect(element.textContent).toContain('Saisissez votre prénom.');
      expect(element.textContent).toContain('Saisissez votre nom.');
      expect(espionInscription).not.toHaveBeenCalled();
    });

    it('émet inscription avec toutes les informations saisies', async () => {
      // Arrange : un espion écoute l'output, l'utilisateur remplit tous les champs.
      const espionInscription = vi.fn();
      fixture.componentInstance.inscription.subscribe(espionInscription);
      saisir('Prénom', 'Jean');
      saisir('Nom', 'Dupont');
      saisir('Adresse e-mail', 'jean.dupont@example.com');
      saisir('Mot de passe', 'motdepasse123');

      // Act : il envoie le formulaire.
      await cliquer('Créer mon compte');

      // Assert : l'output a émis une seule fois, avec toutes les informations.
      expect(espionInscription).toHaveBeenCalledExactlyOnceWith({
        email: 'jean.dupont@example.com',
        password: 'motdepasse123',
        nom: 'Dupont',
        prenom: 'Jean',
      });
    });

    it('revient en mode connexion avec le lien « Se connecter »', async () => {
      // Arrange : mode inscription (beforeEach).

      // Act : l'utilisateur clique sur le lien du bas « Se connecter ».
      await cliquer('Se connecter');

      // Assert : le prénom disparaît et le bouton d'envoi redevient « Se connecter ».
      expect(champ('Prénom')).toBeNull();
      expect(bouton('Se connecter').type).toBe('submit');
    });
  });

  describe('visibilité du mot de passe', () => {
    it('masque le mot de passe par défaut', () => {
      // Arrange : formulaire affiché (beforeEach).

      // Act : rien, on vérifie l'état initial.

      // Assert : type="password", les caractères sont masqués.
      expect(champ('Mot de passe')?.type).toBe('password');
    });

    it('affiche le mot de passe avec le bouton « Afficher »', async () => {
      // Arrange : le mot de passe est masqué.

      // Act : clic sur le bouton (son texte complet inclut la partie réservée aux lecteurs d'écran).
      await cliquer('Afficher le mot de passe');

      // Assert : le mot de passe est lisible et le bouton est signalé comme enfoncé.
      expect(champ('Mot de passe')?.type).toBe('text');
      expect(bouton('Masquer le mot de passe').getAttribute('aria-pressed')).toBe('true');
    });

    it('masque à nouveau le mot de passe avec le bouton « Masquer »', async () => {
      // Arrange : le mot de passe est affiché.
      await cliquer('Afficher le mot de passe');

      // Act : nouveau clic, sur le bouton devenu « Masquer ».
      await cliquer('Masquer le mot de passe');

      // Assert : le mot de passe est de nouveau masqué.
      expect(champ('Mot de passe')?.type).toBe('password');
    });
  });

  describe('inputs reçus du parent', () => {
    it("affiche l'erreur reçue dans une alerte", async () => {
      // Arrange : rien de plus à préparer.

      // Act : le parent transmet un message d'erreur (setInput simule [erreur]="…").
      fixture.componentRef.setInput('erreur', 'E-mail ou mot de passe incorrect.');
      await fixture.whenStable();

      // Assert : le message apparaît dans l'élément de rôle « alert », lu par les lecteurs d'écran.
      expect(element.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'E-mail ou mot de passe incorrect.',
      );
    });

    it("n'affiche aucune alerte sans erreur", () => {
      // Arrange : erreur vaut null par défaut.

      // Act : rien, on vérifie l'affichage initial.

      // Assert : pas d'alerte.
      expect(element.querySelector('[role="alert"]')).toBeNull();
    });

    it("désactive le bouton d'envoi pendant l'envoi", async () => {
      // Arrange : rien de plus à préparer.

      // Act : le parent indique qu'un envoi est en cours.
      fixture.componentRef.setInput('isEnvoiEnCours', true);
      await fixture.whenStable();

      // Assert : le bouton change de texte et ne peut plus être cliqué.
      expect(bouton('Envoi en cours…').disabled).toBe(true);
    });
  });
});
