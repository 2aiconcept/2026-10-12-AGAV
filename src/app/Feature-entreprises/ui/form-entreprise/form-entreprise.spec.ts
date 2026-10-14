import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntrepriseInput } from '../../models/entreprise-input';
import { FormEntreprise } from './form-entreprise';

describe('FormEntreprise', () => {
  let fixture: ComponentFixture<FormEntreprise>;
  let element: HTMLElement;
  let envoyee: EntrepriseInput | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormEntreprise],
    }).compileComponents();

    fixture = TestBed.createComponent(FormEntreprise);
    element = fixture.nativeElement;
    envoyee = undefined;
    fixture.componentInstance.valider.subscribe((valeur) => (envoyee = valeur));
    await fixture.whenStable();
  });

  // Le libellé peut contenir un astérisque décoratif (« Nom * ») : on l'ignore.
  function champ(libelle: string): HTMLInputElement {
    const label = Array.from(element.querySelectorAll('label')).find(
      (l) => l.textContent?.replace('*', '').trim() === libelle,
    );
    return element.querySelector(`#${label?.htmlFor}`) as HTMLInputElement;
  }

  async function saisir(libelle: string, valeur: string): Promise<void> {
    const input = champ(libelle);
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  // submit() lance son action de façon asynchrone : on attend après le clic.
  async function cliquerSurValider(): Promise<void> {
    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  function erreurDe(libelle: string): string | undefined {
    const id = champ(libelle).getAttribute('aria-describedby');
    return id ? element.querySelector(`#${id}`)?.textContent?.trim() : undefined;
  }

  it('affiche un champ par information, chacun avec son libellé', () => {
    expect(champ('Nom')).not.toBeNull();
    expect(champ('Secteur')).not.toBeNull();
    expect(champ('Adresse')).not.toBeNull();
    expect(champ('Téléphone')).not.toBeNull();
  });

  it('a des champs vides sans entreprise (ajout)', () => {
    expect(champ('Nom').value).toBe('');
    expect(champ('Téléphone').value).toBe('');
  });

  it("préremplit les champs avec l'entreprise reçue (modification)", async () => {
    fixture.componentRef.setInput('entreprise', {
      nom: 'TechVision',
      secteur: 'IT & Cloud',
      telephone: '01 45 67 89 00',
    });
    await fixture.whenStable();

    expect(champ('Nom').value).toBe('TechVision');
    expect(champ('Secteur').value).toBe('IT & Cloud');
    expect(champ('Adresse').value).toBe('');
    expect(champ('Téléphone').value).toBe('01 45 67 89 00');
  });

  it('émet les valeurs saisies quand le formulaire est valide', async () => {
    await saisir('Nom', 'DataCorp');
    await saisir('Secteur', 'Data & IA');
    await saisir('Adresse', '25 boulevard de l’Analyse, Bordeaux');
    await saisir('Téléphone', '05 67 89 01 23');

    await cliquerSurValider();

    expect(envoyee).toEqual({
      nom: 'DataCorp',
      secteur: 'Data & IA',
      adresse: '25 boulevard de l’Analyse, Bordeaux',
      telephone: '05 67 89 01 23',
    });
  });

  it('accepte un téléphone vide (champ facultatif)', async () => {
    await saisir('Nom', 'DataCorp');

    await cliquerSurValider();

    expect(envoyee?.nom).toBe('DataCorp');
  });

  it('affiche le libellé de bouton reçu', async () => {
    fixture.componentRef.setInput('libelleValider', 'Ajouter');
    await fixture.whenStable();

    expect(element.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Ajouter');
  });

  describe('validation', () => {
    it("n'affiche aucune erreur avant que l'utilisateur ait touché les champs", () => {
      expect(element.querySelector('.invalid-feedback')).toBeNull();
      expect(champ('Nom').getAttribute('aria-invalid')).not.toBe('true');
    });

    it("n'émet rien et affiche l'erreur si le nom est vide à la validation", async () => {
      await cliquerSurValider();

      expect(envoyee).toBeUndefined();
      expect(erreurDe('Nom')).toBe('Le nom est obligatoire.');
      expect(champ('Nom').getAttribute('aria-invalid')).toBe('true');
    });

    it('signale un nom trop court', async () => {
      await saisir('Nom', 'A');

      expect(erreurDe('Nom')).toBe('Le nom doit faire au moins 2 caractères.');
    });

    it('signale un téléphone au mauvais format', async () => {
      await saisir('Nom', 'DataCorp');
      await saisir('Téléphone', '12 34');

      await cliquerSurValider();

      expect(envoyee).toBeUndefined();
      expect(erreurDe('Téléphone')).toBe(
        'Saisissez un numéro à 10 chiffres, par exemple 01 45 67 89 00.',
      );
    });

    it("retire l'erreur dès que le champ devient valide", async () => {
      await saisir('Nom', 'A');
      await saisir('Nom', 'DataCorp');

      expect(erreurDe('Nom')).toBeUndefined();
      expect(champ('Nom').getAttribute('aria-invalid')).not.toBe('true');
    });
  });
});
