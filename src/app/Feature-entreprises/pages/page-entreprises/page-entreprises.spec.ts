import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { EntreprisesService } from '../../data-access/entreprises-service';
import { Entreprise } from '../../models/entreprise';
import PageEntreprises from './page-entreprises';

describe('PageEntreprises', () => {
  let fixture: ComponentFixture<PageEntreprises>;
  let element: HTMLElement;
  let fauxService: {
    lister: ReturnType<typeof vi.fn>;
    supprimer: ReturnType<typeof vi.fn>;
  };

  const entreprises: Entreprise[] = [
    { id: 1, nom: 'TechVision', secteur: 'IT & Cloud', adresse: 'Paris', telephone: '01 45 67 89 00' },
    { id: 2, nom: 'StratConseil', secteur: 'Conseil', adresse: 'Lyon', telephone: '04 72 33 45 00' },
  ];

  async function afficherPage(reponse: Observable<Entreprise[]>): Promise<void> {
    fauxService = {
      lister: vi.fn(() => reponse),
      supprimer: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [PageEntreprises],
      providers: [provideRouter([]), { provide: EntreprisesService, useValue: fauxService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PageEntreprises);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  it('affiche le titre de la page', async () => {
    await afficherPage(of(entreprises));

    expect(element.querySelector('h1')?.textContent).toBe('Entreprises');
  });

  it('affiche un lien « Ajouter une entreprise » vers la page de création', async () => {
    await afficherPage(of(entreprises));

    const lien = Array.from(element.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Ajouter une entreprise'),
    );

    expect(lien?.getAttribute('href')).toBe('/entreprises/ajouter');
  });

  it('affiche une ligne par entreprise', async () => {
    await afficherPage(of(entreprises));

    const lignes = element.querySelectorAll('tbody tr');

    expect(lignes.length).toBe(2);
    expect(lignes[0].textContent).toContain('TechVision');
    expect(lignes[0].textContent).toContain('IT & Cloud');
    expect(lignes[1].textContent).toContain('StratConseil');
  });

  it("affiche le nombre d'entreprises", async () => {
    await afficherPage(of(entreprises));

    expect(element.textContent).toContain('2 entreprise(s) affichée(s)');
  });

  it("affiche un message quand il n'y a aucune entreprise", async () => {
    await afficherPage(of([]));

    expect(element.textContent).toContain('Aucune entreprise.');
  });

  it("affiche un message de chargement tant que l'API n'a pas répondu", async () => {
    const reponse = new Subject<Entreprise[]>();
    await afficherPage(reponse);

    expect(element.textContent).toContain('Chargement des entreprises…');

    reponse.next(entreprises);
    await fixture.whenStable();

    expect(element.textContent).not.toContain('Chargement des entreprises…');
    expect(element.querySelectorAll('tbody tr').length).toBe(2);
  });

  describe('colonne Actions', () => {
    let confirmer: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      confirmer = vi.spyOn(window, 'confirm').mockReturnValue(true);
      await afficherPage(of(entreprises));
    });

    afterEach(() => {
      confirmer.mockRestore();
    });

    function boutonSupprimer(nom: string): HTMLButtonElement {
      return Array.from(element.querySelectorAll('button')).find(
        (b) => b.textContent?.replace(/\s+/g, ' ').trim() === `Supprimer ${nom}`,
      ) as HTMLButtonElement;
    }

    it('affiche un lien « Modifier » vers la page de modification de chaque entreprise', () => {
      const lien = Array.from(element.querySelectorAll('a')).find((a) =>
        a.textContent?.includes('TechVision'),
      );

      expect(lien?.textContent).toContain('Modifier');
      expect(lien?.getAttribute('href')).toBe('/entreprises/1/modifier');
    });

    it("nomme chaque bouton avec l'entreprise concernée", () => {
      expect(boutonSupprimer('TechVision')).toBeDefined();
      expect(boutonSupprimer('StratConseil')).toBeDefined();
    });

    it("supprime l'entreprise après confirmation puis recharge la liste", async () => {
      boutonSupprimer('TechVision').click();
      await fixture.whenStable();

      expect(confirmer).toHaveBeenCalledWith("Supprimer l'entreprise TechVision ?");
      expect(fauxService.supprimer).toHaveBeenCalledWith(1);
      expect(fauxService.lister).toHaveBeenCalledTimes(2);
    });

    it('ne supprime rien si on annule la confirmation', async () => {
      confirmer.mockReturnValue(false);

      boutonSupprimer('TechVision').click();
      await fixture.whenStable();

      expect(fauxService.supprimer).not.toHaveBeenCalled();
      expect(fauxService.lister).toHaveBeenCalledTimes(1);
    });
  });
});
