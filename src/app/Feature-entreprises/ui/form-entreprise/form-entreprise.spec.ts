// =================================================================================================
// Ce qu'il faut tester : FormEntreprise (formulaire, composant dumb, Signal Forms)
// =================================================================================================
// Un composant dumb a un contrat simple : il reçoit des inputs, affiche, et émet un output.
// On vérifie donc, comme un utilisateur qui remplit le formulaire :
// - l'affichage : un champ par information, chacun relié à son libellé ; le libellé du bouton
//   reçu en input (« Ajouter » / « Enregistrer ») ;
// - les inputs : sans entreprise, les champs sont vides (ajout) ; avec une entreprise, ils sont
//   préremplis (modification) ;
// - l'output : « valider » émet les valeurs saisies, SEULEMENT si le formulaire est valide ;
// - la validation : nom obligatoire, longueurs min / max, format du téléphone ; les erreurs
//   n'apparaissent qu'après qu'on a touché le champ ou cliqué sur le bouton, elles sont reliées
//   au champ (aria-describedby, aria-invalid) et disparaissent quand le champ redevient valide.
//
// Ce qu'on ne teste PAS : l'objet « formulaire » de Signal Forms, le signal « modele » ou la
// méthode soumettre(). On passe uniquement par le DOM (saisie, clic) et par l'output.
//
// Stratégie : aucun service à remplacer (composant dumb). On fixe les inputs avec
// fixture.componentRef.setInput(), on simule la saisie avec des événements DOM, et on écoute
// l'output « valider » en s'y abonnant.
// =================================================================================================

// ComponentFixture : l'enveloppe de test du composant ; TestBed : le banc d'essai Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Le type des données émises par le formulaire.
import { EntrepriseInput } from '../../models/entreprise-input';
// Le composant testé.
import { FormEntreprise } from './form-entreprise';

// Messages d'erreur attendus (les mêmes que dans le schéma de validation du composant).
const ERREUR_NOM_OBLIGATOIRE = 'Le nom est obligatoire.';
const ERREUR_NOM_TROP_COURT = 'Le nom doit faire au moins 2 caractères.';
const ERREUR_NOM_TROP_LONG = 'Le nom doit faire au plus 100 caractères.';
const ERREUR_TELEPHONE = 'Saisissez un numéro à 10 chiffres, par exemple 01 45 67 89 00.';
// Un nom de 101 caractères : un de plus que la limite de 100.
const NOM_DE_101_CARACTERES = 'A'.repeat(101);

describe('FormEntreprise', () => {
  let fixture: ComponentFixture<FormEntreprise>;
  let element: HTMLElement;
  // La dernière valeur émise par l'output « valider » (undefined si rien n'a été émis).
  let valeurEmise: EntrepriseInput | undefined;

  beforeEach(async () => {
    // Composant standalone : on le déclare dans imports. Aucun provider nécessaire.
    await TestBed.configureTestingModule({
      imports: [FormEntreprise],
    }).compileComponents();

    fixture = TestBed.createComponent(FormEntreprise);
    element = fixture.nativeElement;
    valeurEmise = undefined;
    // Un output() se comporte comme un événement : on s'y abonne pour récupérer ce qu'il émet,
    // exactement comme le ferait le parent avec (valider)="…".
    fixture.componentInstance.valider.subscribe((valeur) => (valeurEmise = valeur));
    // Premier affichage. Sans danger : aucune requête HTTP dans ce composant.
    await fixture.whenStable();
  });

  // Trouve un champ par son libellé, comme l'utilisateur. Le libellé du nom contient un
  // astérisque décoratif (« Nom * ») qu'on ignore ; label.htmlFor donne l'id du champ associé.
  function champ(libelle: string): HTMLInputElement {
    const label = Array.from(element.querySelectorAll('label')).find(
      (l) => l.textContent?.replace('*', '').trim() === libelle,
    );
    return element.querySelector(`#${label?.htmlFor}`) as HTMLInputElement;
  }

  // Le bouton du formulaire (rôle « button »). Il n'y en a qu'un.
  function boutonValider(): HTMLButtonElement {
    return element.querySelector('button') as HTMLButtonElement;
  }

  // Simule une saisie : on change la valeur, puis on envoie les événements qu'enverrait le
  // navigateur. « input » : Signal Forms recopie la valeur dans le modèle. « blur » : le champ est
  // quitté, il devient « touché » (ses erreurs peuvent alors s'afficher).
  async function saisir(libelle: string, valeur: string): Promise<void> {
    const input = champ(libelle);
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    // On attend que l'écran soit à jour (erreurs affichées ou retirées).
    await fixture.whenStable();
  }

  // submit() des Signal Forms lance son action de façon ASYNCHRONE (la fonction passée est async) :
  // juste après le clic, rien n'est encore émis. setTimeout(resolve) laisse cette action se
  // terminer, puis whenStable() attend que l'écran soit à jour.
  async function cliquerSurValider(): Promise<void> {
    boutonValider().click();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  // Le texte de l'erreur reliée au champ par aria-describedby (comme un lecteur d'écran le lirait),
  // ou undefined si le champ n'a pas d'erreur reliée.
  function erreurDe(libelle: string): string | undefined {
    const id = champ(libelle).getAttribute('aria-describedby');
    return id ? element.querySelector(`#${id}`)?.textContent?.trim() : undefined;
  }

  describe('affichage', () => {
    it('affiche un champ par information, chacun relié à son libellé', () => {
      // Arrange : le formulaire est affiché (beforeEach).

      // Act + Assert : chaque libellé mène à un champ (sinon champ() renverrait null).
      expect(champ('Nom')).not.toBeNull();
      expect(champ('Secteur')).not.toBeNull();
      expect(champ('Adresse')).not.toBeNull();
      expect(champ('Téléphone')).not.toBeNull();
    });

    it("affiche « Enregistrer » sur le bouton si aucun libellé n'est fourni", () => {
      // Arrange : aucun input libelleValider fixé : la valeur par défaut s'applique.

      // Act + Assert : le texte du bouton.
      expect(boutonValider().textContent?.trim()).toBe('Enregistrer');
    });

    it('affiche le libellé de bouton reçu en input', async () => {
      // Arrange : rien de plus.

      // Act : le parent passe libelleValider="Ajouter". setInput() fait la même chose en test.
      fixture.componentRef.setInput('libelleValider', 'Ajouter');
      await fixture.whenStable();

      // Assert : le bouton affiche le nouveau libellé.
      expect(boutonValider().textContent?.trim()).toBe('Ajouter');
    });

    it("a des champs vides quand aucune entreprise n'est reçue (ajout)", () => {
      // Arrange : aucun input entreprise fixé.

      // Act + Assert : tous les champs sont vides.
      expect(champ('Nom').value).toBe('');
      expect(champ('Secteur').value).toBe('');
      expect(champ('Adresse').value).toBe('');
      expect(champ('Téléphone').value).toBe('');
    });

    it("préremplit les champs avec l'entreprise reçue (modification)", async () => {
      // Arrange : rien de plus.

      // Act : le parent passe une entreprise (sans adresse) en input.
      fixture.componentRef.setInput('entreprise', {
        nom: 'TechVision',
        secteur: 'IT & Cloud',
        telephone: '01 45 67 89 00',
      });
      await fixture.whenStable();

      // Assert : les champs reprennent ses valeurs ; le champ absent (adresse) reste vide.
      expect(champ('Nom').value).toBe('TechVision');
      expect(champ('Secteur').value).toBe('IT & Cloud');
      expect(champ('Adresse').value).toBe('');
      expect(champ('Téléphone').value).toBe('01 45 67 89 00');
    });
  });

  describe('envoi', () => {
    it('émet les valeurs saisies quand le formulaire est valide', async () => {
      // Arrange : l'utilisateur remplit tous les champs avec des valeurs valides.
      await saisir('Nom', 'DataCorp');
      await saisir('Secteur', 'Data & IA');
      await saisir('Adresse', "25 boulevard de l'Analyse, Bordeaux");
      await saisir('Téléphone', '05 67 89 01 23');

      // Act : clic sur le bouton.
      await cliquerSurValider();

      // Assert : l'output a émis exactement les valeurs saisies.
      expect(valeurEmise).toEqual({
        nom: 'DataCorp',
        secteur: 'Data & IA',
        adresse: "25 boulevard de l'Analyse, Bordeaux",
        telephone: '05 67 89 01 23',
      });
    });

    it('émet le formulaire avec seulement le nom (les autres champs sont facultatifs)', async () => {
      // Arrange : seul le nom est rempli ; le téléphone vide ne doit pas bloquer.
      await saisir('Nom', 'DataCorp');

      // Act : clic sur le bouton.
      await cliquerSurValider();

      // Assert : l'output a émis, les champs non remplis valent '' (chaîne vide).
      expect(valeurEmise).toEqual({ nom: 'DataCorp', secteur: '', adresse: '', telephone: '' });
    });
  });

  describe('validation', () => {
    it("n'affiche aucune erreur avant que l'utilisateur ait touché les champs", () => {
      // Arrange : le formulaire vient d'apparaître, le nom vide est pourtant invalide.

      // Act + Assert : aucun champ n'est signalé invalide, aucun message n'est relié ni affiché.
      expect(champ('Nom').getAttribute('aria-invalid')).not.toBe('true');
      expect(erreurDe('Nom')).toBeUndefined();
      expect(element.textContent).not.toContain(ERREUR_NOM_OBLIGATOIRE);
    });

    it("n'émet rien et affiche l'erreur si le nom est vide à la validation", async () => {
      // Arrange : aucun champ rempli.

      // Act : clic sur le bouton (submit() marque alors tous les champs comme touchés).
      await cliquerSurValider();

      // Assert : rien n'est émis, le champ est signalé invalide et le message lui est relié.
      expect(valeurEmise).toBeUndefined();
      expect(champ('Nom').getAttribute('aria-invalid')).toBe('true');
      expect(erreurDe('Nom')).toBe(ERREUR_NOM_OBLIGATOIRE);
    });

    it('signale un nom trop court dès que le champ est quitté', async () => {
      // Arrange : rien à préparer.

      // Act : saisie d'un seul caractère, puis on quitte le champ (blur).
      await saisir('Nom', 'A');

      // Assert : le message de longueur minimale est relié au champ.
      expect(erreurDe('Nom')).toBe(ERREUR_NOM_TROP_COURT);
    });

    it('signale un nom trop long', async () => {
      // Arrange : rien à préparer.

      // Act : saisie d'un nom de 101 caractères.
      await saisir('Nom', NOM_DE_101_CARACTERES);

      // Assert : le message de longueur maximale est relié au champ.
      expect(erreurDe('Nom')).toBe(ERREUR_NOM_TROP_LONG);
    });

    it("n'émet rien et signale un téléphone au mauvais format", async () => {
      // Arrange : un nom valide, mais un téléphone incomplet.
      await saisir('Nom', 'DataCorp');
      await saisir('Téléphone', '12 34');

      // Act : clic sur le bouton.
      await cliquerSurValider();

      // Assert : rien n'est émis et le message de format est relié au champ téléphone.
      expect(valeurEmise).toBeUndefined();
      expect(erreurDe('Téléphone')).toBe(ERREUR_TELEPHONE);
    });

    it("retire l'erreur dès que le champ redevient valide", async () => {
      // Arrange : le nom est en erreur (trop court).
      await saisir('Nom', 'A');

      // Act : l'utilisateur corrige sa saisie.
      await saisir('Nom', 'DataCorp');

      // Assert : plus de message relié, et le champ n'est plus signalé invalide.
      expect(erreurDe('Nom')).toBeUndefined();
      expect(champ('Nom').getAttribute('aria-invalid')).not.toBe('true');
    });
  });
});
