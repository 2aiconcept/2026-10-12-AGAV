import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Entreprise } from '../../models/entreprise';
import PageEntreprises from './page-entreprises';

const URL_ENTREPRISES = `${environment.apiBaseUrl}/entreprises`;

describe('PageEntreprises', () => {
  let fixture: ComponentFixture<PageEntreprises>;
  let element: HTMLElement;
  let httpTesting: HttpTestingController;

  const entreprises: Entreprise[] = [
    { id: 1, nom: 'TechVision', secteur: 'IT & Cloud', adresse: 'Paris', telephone: '01 45 67 89 00' },
    { id: 2, nom: 'StratConseil', secteur: 'Conseil', adresse: 'Lyon', telephone: '04 72 33 45 00' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageEntreprises],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PageEntreprises);
    element = fixture.nativeElement;
    // Pas de whenStable ici : la requête de httpResource est en attente tant qu'on n'y répond pas.
    // tick() affiche la page et déclenche l'envoi de la requête.
    TestBed.tick();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // Après un flush, la suite d'une fonction async (après un await) s'exécute plus tard.
  function laisserFinirLesPromesses(): Promise<unknown> {
    return new Promise((resolve) => setTimeout(resolve));
  }

  async function attendreLaReponse(): Promise<void> {
    await laisserFinirLesPromesses();
    await fixture.whenStable();
  }

  async function repondre(reponse: Entreprise[]): Promise<void> {
    httpTesting.expectOne(URL_ENTREPRISES).flush(reponse);
    await attendreLaReponse();
  }

  it('affiche le titre de la page', async () => {
    await repondre(entreprises);

    expect(element.querySelector('h1')?.textContent).toBe('Entreprises');
  });

  it('affiche un lien « Ajouter une entreprise » vers la page de création', async () => {
    await repondre(entreprises);

    const lien = Array.from(element.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Ajouter une entreprise'),
    );

    expect(lien?.getAttribute('href')).toBe('/entreprises/ajouter');
  });

  it("affiche un message de chargement tant que l'API n'a pas répondu", async () => {
    expect(element.textContent).toContain('Chargement des entreprises…');

    await repondre(entreprises);

    expect(element.textContent).not.toContain('Chargement des entreprises…');
  });

  it('affiche une ligne par entreprise', async () => {
    await repondre(entreprises);

    const lignes = element.querySelectorAll('tbody tr');

    expect(lignes.length).toBe(2);
    expect(lignes[0].textContent).toContain('TechVision');
    expect(lignes[0].textContent).toContain('IT & Cloud');
    expect(lignes[1].textContent).toContain('StratConseil');
  });

  it("affiche le nombre d'entreprises", async () => {
    await repondre(entreprises);

    expect(element.textContent).toContain('2 entreprise(s) affichée(s)');
  });

  it("affiche un message quand il n'y a aucune entreprise", async () => {
    await repondre([]);

    expect(element.textContent).toContain('Aucune entreprise.');
  });

  it('affiche une erreur si le chargement échoue', async () => {
    httpTesting
      .expectOne(URL_ENTREPRISES)
      .flush({ error: 'erreur' }, { status: 500, statusText: 'Erreur' });
    await attendreLaReponse();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Impossible de charger les entreprises.',
    );
  });

  describe('colonne Actions', () => {
    let confirmer: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      confirmer = vi.spyOn(window, 'confirm').mockReturnValue(true);
      await repondre(entreprises);
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

    it("supprime l'entreprise après confirmation puis relit la liste sur l'API", async () => {
      boutonSupprimer('TechVision').click();

      const suppression = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      expect(suppression.request.method).toBe('DELETE');
      suppression.flush(null);
      // Pas de whenStable : après le DELETE, reload() lance un GET qui reste en attente.
      await laisserFinirLesPromesses();

      // reload() relance le GET : la liste affichée est celle renvoyée par l'API.
      TestBed.tick();
      await repondre([entreprises[1]]);

      expect(confirmer).toHaveBeenCalledWith("Supprimer l'entreprise TechVision ?");
      expect(element.querySelectorAll('tbody tr').length).toBe(1);
      expect(element.textContent).not.toContain('TechVision');
    });

    it("affiche la liste de l'API, même si un autre utilisateur l'a changée entre-temps", async () => {
      boutonSupprimer('TechVision').click();
      httpTesting.expectOne(`${URL_ENTREPRISES}/1`).flush(null);
      await laisserFinirLesPromesses();
      TestBed.tick();

      const ajouteeParUnCollegue: Entreprise = { id: 3, nom: 'ShopNow', secteur: 'E-commerce' };
      await repondre([entreprises[1], ajouteeParUnCollegue]);

      expect(element.textContent).toContain('ShopNow');
      expect(element.querySelectorAll('tbody tr').length).toBe(2);
    });

    it('ne supprime rien si on annule la confirmation', async () => {
      confirmer.mockReturnValue(false);

      boutonSupprimer('TechVision').click();
      await fixture.whenStable();

      httpTesting.expectNone(`${URL_ENTREPRISES}/1`);
      expect(element.querySelectorAll('tbody tr').length).toBe(2);
    });
  });
});
