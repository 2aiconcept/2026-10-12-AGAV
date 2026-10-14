// =================================================================================================
// Ce qu'il faut tester : PageModifierEntreprise (page de modification, composant smart)
// =================================================================================================
// La page lit l'id dans l'URL, charge l'entreprise, la passe au formulaire, puis enregistre.
// On vérifie, du point de vue de l'utilisateur :
// - le chargement : l'entreprise de l'URL (id 3) est demandée, et le formulaire est prérempli ;
// - les trois états de l'écran : « Chargement… » tant que l'API n'a pas répondu, le formulaire
//   quand l'entreprise est arrivée, un message d'erreur (sans formulaire) si elle est introuvable ;
// - l'enregistrement réussi : le store reçoit l'id et les modifications, puis retour à la liste ;
// - l'enregistrement raté : message d'erreur, et on reste sur la page.
//
// Ce qu'on ne teste PAS : la validation des champs (testée dans form-entreprise.spec.ts), les
// requêtes HTTP et la relecture de la liste (testées dans entreprises-service.spec.ts et
// entreprises-store.spec.ts), les signals internes de la page.
//
// Stratégie :
// - la page injecte DEUX dépendances : le service (pour LIRE l'entreprise : trouver) et le store
//   (pour ENREGISTRER : modifier). On remplace les deux par des faux (fonctions espions vi.fn()),
//   dont on choisit la réponse à chaque test ;
// - une FAUSSE route active (ActivatedRoute) qui simule l'URL /entreprises/3/modifier ;
// - comme le chargement démarre dès le constructeur, et que sa réponse dépend du test, la page est
//   créée DANS chaque test (fonction afficherPage), après avoir préparé le faux service.
// =================================================================================================

// ComponentFixture : l'enveloppe de test du composant ; TestBed : le banc d'essai Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// By.directive : retrouve un composant enfant (ici FormEntreprise) dans la page.
import { By } from '@angular/platform-browser';
// ActivatedRoute : la route active, qu'on remplace par une fausse.
// convertToParamMap : transforme un objet { id: '3' } en ParamMap (le type de paramMap).
// provideRouter / Router : le routeur (routerLink, navigateByUrl qu'on espionne).
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
// Le service et le store à remplacer par des faux.
import { EntreprisesService } from '../../data-access/entreprises-service';
import { EntreprisesStore } from '../../data-access/entreprises-store';
// Les types des données.
import { Entreprise } from '../../models/entreprise';
import { EntrepriseInput } from '../../models/entreprise-input';
// Le formulaire enfant, pour le retrouver avec By.directive.
import { FormEntreprise } from '../../ui/form-entreprise/form-entreprise';
// Le composant testé.
import PageModifierEntreprise from './page-modifier-entreprise';

// L'id présent dans l'URL simulée.
const ID_DANS_L_URL = 3;

describe('PageModifierEntreprise', () => {
  let fixture: ComponentFixture<PageModifierEntreprise>;
  let element: HTMLElement;
  // Espion sur Router.navigateByUrl : on vérifie la navigation sans changer de page.
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  // Le faux service : seule la méthode utilisée par la page (trouver).
  let fauxService: { trouver: ReturnType<typeof vi.fn> };
  // Le faux store : seule la méthode utilisée par la page (modifier).
  let fauxStore: { modifier: ReturnType<typeof vi.fn> };

  // L'entreprise renvoyée par l'API pour l'id 3.
  const techVision: Entreprise = {
    id: ID_DANS_L_URL,
    nom: 'TechVision',
    secteur: 'IT & Cloud',
    adresse: 'Paris',
    telephone: '01 45 67 89 00',
  };
  // Les modifications « saisies » dans le formulaire.
  const modifications: EntrepriseInput = { nom: 'TechVision SAS' };

  beforeEach(() => {
    // Des espions neufs pour chaque test : aucun état partagé entre deux tests.
    fauxService = { trouver: vi.fn() };
    fauxStore = { modifier: vi.fn() };
  });

  // La page appelle des fonctions async (charger, enregistrer) : la suite de leurs « await »
  // s'exécute plus tard. setTimeout(resolve) laisse ces promesses se terminer, puis whenStable()
  // attend que l'écran soit à jour.
  async function attendre(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  // Configure l'environnement, crée la page et attend son premier affichage.
  // À appeler APRÈS avoir choisi la réponse de fauxService.trouver.
  async function afficherPage(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [PageModifierEntreprise],
      providers: [
        provideRouter([]),
        // « Quand quelqu'un demande EntreprisesService, donne-lui fauxService. »
        { provide: EntreprisesService, useValue: fauxService },
        // « Quand quelqu'un demande EntreprisesStore, donne-lui fauxStore. »
        { provide: EntreprisesStore, useValue: fauxStore },
        // Fausse route active : la page lit snapshot.paramMap.get('id') et obtient '3'
        // (les paramètres d'URL sont toujours des chaînes).
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: String(ID_DANS_L_URL) }) } },
        },
      ],
    }).compileComponents();

    // mockResolvedValue(true) : la navigation « réussit » sans changer de page.
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    // Le constructeur de la page s'exécute ici : le chargement démarre.
    fixture = TestBed.createComponent(PageModifierEntreprise);
    element = fixture.nativeElement;
    await attendre();
  }

  // Le formulaire enfant, ou null s'il n'est pas affiché.
  function formulaire(): FormEntreprise | null {
    return fixture.debugElement.query(By.directive(FormEntreprise))?.componentInstance ?? null;
  }

  // Trouve un champ par son libellé, comme l'utilisateur. Le libellé du nom contient un
  // astérisque décoratif (« Nom * ») qu'on ignore ; label.htmlFor donne l'id du champ associé.
  function champ(libelle: string): HTMLInputElement | null {
    const label = Array.from(element.querySelectorAll('label')).find(
      (l) => l.textContent?.replace('*', '').trim() === libelle,
    );
    return label ? element.querySelector<HTMLInputElement>(`#${label.htmlFor}`) : null;
  }

  it("charge l'entreprise de l'URL et préremplit le formulaire", async () => {
    // Arrange : l'API renvoie TechVision.
    fauxService.trouver.mockResolvedValue(techVision);

    // Act : la page s'affiche (le chargement part depuis le constructeur).
    await afficherPage();

    // Assert : l'id lu dans l'URL a été converti en nombre, et les champs sont préremplis.
    expect(fauxService.trouver).toHaveBeenCalledWith(ID_DANS_L_URL);
    expect(element.querySelector('h1')?.textContent).toBe('Modifier une entreprise');
    expect(champ('Nom')?.value).toBe('TechVision');
    expect(champ('Téléphone')?.value).toBe('01 45 67 89 00');
  });

  it("affiche un message de chargement tant que l'API n'a pas répondu", async () => {
    // Arrange : une Promise qui ne se termine jamais = une API qui ne répond pas encore.
    fauxService.trouver.mockReturnValue(new Promise(() => undefined));

    // Act : la page s'affiche.
    await afficherPage();

    // Assert : le message de chargement, et pas encore de formulaire.
    expect(element.textContent).toContain("Chargement de l'entreprise…");
    expect(formulaire()).toBeNull();
  });

  it("affiche une erreur, sans formulaire, si l'entreprise ne peut pas être chargée", async () => {
    // Arrange : l'API échoue (entreprise supprimée, par exemple).
    fauxService.trouver.mockRejectedValue(new Error('404'));

    // Act : la page s'affiche.
    await afficherPage();

    // Assert : le message d'erreur est annoncé (role="alert") et le formulaire n'est pas affiché.
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Impossible de charger cette entreprise.',
    );
    expect(formulaire()).toBeNull();
  });

  it('enregistre les modifications puis revient à la liste', async () => {
    // Arrange : l'entreprise est chargée, et l'API acceptera la modification.
    fauxService.trouver.mockResolvedValue(techVision);
    fauxStore.modifier.mockResolvedValue(undefined);
    await afficherPage();

    // Act : le formulaire émet « valider » (comme après un clic sur un formulaire valide).
    formulaire()?.valider.emit(modifications);
    await attendre();

    // Assert : le store a reçu l'id de l'URL et les modifications, puis retour à la liste.
    expect(fauxStore.modifier).toHaveBeenCalledWith(ID_DANS_L_URL, modifications);
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it("affiche une erreur et reste sur la page si l'enregistrement échoue", async () => {
    // Arrange : l'entreprise est chargée, mais l'API refusera la modification.
    fauxService.trouver.mockResolvedValue(techVision);
    fauxStore.modifier.mockRejectedValue(new Error('500'));
    await afficherPage();

    // Act : le formulaire émet « valider ».
    formulaire()?.valider.emit(modifications);
    await attendre();

    // Assert : message d'erreur, aucune navigation, et le formulaire est toujours là.
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      "Les modifications n'ont pas pu être enregistrées.",
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(formulaire()).not.toBeNull();
  });
});
