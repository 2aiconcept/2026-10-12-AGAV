import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { EntreprisesService } from '../../data-access/entreprises-service';
import { EntrepriseInput } from '../../models/entreprise-input';
import { FormEntreprise } from '../../ui/form-entreprise/form-entreprise';
import PageAjouterEntreprise from './page-ajouter-entreprise';

describe('PageAjouterEntreprise', () => {
  let fixture: ComponentFixture<PageAjouterEntreprise>;
  let element: HTMLElement;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  const fauxService = { creer: vi.fn() };

  const nouvelleEntreprise: EntrepriseInput = { nom: 'DataCorp', secteur: 'Data & IA' };

  beforeEach(async () => {
    fauxService.creer.mockReset();

    await TestBed.configureTestingModule({
      imports: [PageAjouterEntreprise],
      providers: [provideRouter([]), { provide: EntreprisesService, useValue: fauxService }],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(PageAjouterEntreprise);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function validerLeFormulaire(entreprise: EntrepriseInput): void {
    fixture.debugElement.query(By.directive(FormEntreprise)).componentInstance.valider.emit(entreprise);
  }

  it('affiche le titre et le formulaire', () => {
    expect(element.querySelector('h1')?.textContent).toBe('Ajouter une entreprise');
    expect(element.querySelector('app-form-entreprise')).not.toBeNull();
    expect(element.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Ajouter');
  });

  it('crée l’entreprise puis revient à la liste', async () => {
    fauxService.creer.mockResolvedValue({ id: 5, ...nouvelleEntreprise });

    validerLeFormulaire(nouvelleEntreprise);
    await fixture.whenStable();

    expect(fauxService.creer).toHaveBeenCalledWith(nouvelleEntreprise);
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it('affiche une erreur et reste sur la page si la création échoue', async () => {
    fauxService.creer.mockRejectedValue(new Error('erreur'));

    validerLeFormulaire(nouvelleEntreprise);
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      "L'entreprise n'a pas pu être ajoutée.",
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('propose un lien de retour vers la liste', () => {
    const lien = Array.from(element.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Retour à la liste'),
    );

    expect(lien?.getAttribute('href')).toBe('/entreprises');
  });
});
