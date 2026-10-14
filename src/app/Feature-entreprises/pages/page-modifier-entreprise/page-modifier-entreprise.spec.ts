import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { EntreprisesService } from '../../data-access/entreprises-service';
import { Entreprise } from '../../models/entreprise';
import { FormEntreprise } from '../../ui/form-entreprise/form-entreprise';
import PageModifierEntreprise from './page-modifier-entreprise';

describe('PageModifierEntreprise', () => {
  let fixture: ComponentFixture<PageModifierEntreprise>;
  let element: HTMLElement;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  const fauxService = { trouver: vi.fn(), modifier: vi.fn() };

  const techVision: Entreprise = {
    id: 3,
    nom: 'TechVision',
    secteur: 'IT & Cloud',
    adresse: 'Paris',
    telephone: '01 45 67 89 00',
  };

  // Laisse les promesses (await) se terminer, puis attend l'affichage.
  async function attendre(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  async function afficherPage(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [PageModifierEntreprise],
      providers: [
        provideRouter([]),
        { provide: EntreprisesService, useValue: fauxService },
        // La route active simulée : /entreprises/3/modifier.
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } },
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(PageModifierEntreprise);
    element = fixture.nativeElement;
    await attendre();
  }

  beforeEach(() => {
    fauxService.trouver.mockReset();
    fauxService.modifier.mockReset();
  });

  it("charge l'entreprise de l'URL et préremplit le formulaire", async () => {
    fauxService.trouver.mockResolvedValue(techVision);

    await afficherPage();

    expect(fauxService.trouver).toHaveBeenCalledWith(3);
    expect(element.querySelector('h1')?.textContent).toBe('Modifier une entreprise');
    expect((element.querySelector('#entreprise-nom') as HTMLInputElement).value).toBe('TechVision');
  });

  it('affiche un message de chargement tant que l’API n’a pas répondu', async () => {
    fauxService.trouver.mockReturnValue(new Promise(() => undefined));

    await afficherPage();

    expect(element.textContent).toContain("Chargement de l'entreprise…");
    expect(element.querySelector('app-form-entreprise')).toBeNull();
  });

  it("affiche une erreur si l'entreprise ne peut pas être chargée", async () => {
    fauxService.trouver.mockRejectedValue(new Error('404'));

    await afficherPage();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Impossible de charger cette entreprise.',
    );
    expect(element.querySelector('app-form-entreprise')).toBeNull();
  });

  it('enregistre les modifications puis revient à la liste', async () => {
    fauxService.trouver.mockResolvedValue(techVision);
    fauxService.modifier.mockResolvedValue({ ...techVision, nom: 'TechVision SAS' });
    await afficherPage();

    fixture.debugElement
      .query(By.directive(FormEntreprise))
      .componentInstance.valider.emit({ nom: 'TechVision SAS' });
    await attendre();

    expect(fauxService.modifier).toHaveBeenCalledWith(3, { nom: 'TechVision SAS' });
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it("affiche une erreur et reste sur la page si l'enregistrement échoue", async () => {
    fauxService.trouver.mockResolvedValue(techVision);
    fauxService.modifier.mockRejectedValue(new Error('500'));
    await afficherPage();

    fixture.debugElement
      .query(By.directive(FormEntreprise))
      .componentInstance.valider.emit({ nom: 'TechVision SAS' });
    await attendre();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      "Les modifications n'ont pas pu être enregistrées.",
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
