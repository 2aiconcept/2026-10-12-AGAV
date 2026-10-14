// =================================================================================================
// Ce qu'il faut tester : PageAjouterEntreprise (page d'ajout, composant smart)
// =================================================================================================
// Le rôle de cette page : afficher le formulaire, et quand il est validé, demander la création
// à l'API puis revenir à la liste. On vérifie donc :
// - ce qui s'affiche : le titre, le formulaire avec un bouton « Ajouter », le lien de retour ;
// - le cas qui réussit : le service reçoit les données saisies, puis on navigue vers la liste ;
// - le cas qui échoue : un message d'erreur s'affiche et on RESTE sur la page.
//
// Ce qu'on ne teste PAS :
// - la validation des champs : c'est le travail de FormEntreprise, testé dans son propre fichier ;
// - la requête HTTP : c'est le travail du service, testé dans entreprises-service.spec.ts ;
// - les signals internes (hasError) : on regarde le message affiché, pas la variable.
//
// Stratégie : un FAUX service (un objet avec une fonction espion vi.fn()) remplace le vrai
// EntreprisesService. On choisit sa réponse à chaque test (succès ou échec) sans aucun HTTP.
// Pour simuler la validation du formulaire, on fait émettre directement l'output « valider » du
// composant enfant : c'est exactement ce que la page reçoit en vrai, sans dépendre des champs.
// =================================================================================================

// ComponentFixture : l'enveloppe de test du composant ; TestBed : le banc d'essai Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// By : outil de recherche dans l'arbre des composants (ex. By.directive(FormEntreprise) trouve
// le composant enfant FormEntreprise, et donne accès à son instance).
import { By } from '@angular/platform-browser';
// provideRouter : la page utilise le routeur (navigateByUrl, routerLink).
// Router : le service de navigation, qu'on va espionner.
import { provideRouter, Router } from '@angular/router';
// Le service à remplacer par un faux (il sert de « clé » dans les providers).
import { EntreprisesService } from '../../data-access/entreprises-service';
// Le type des données émises par le formulaire.
import { EntrepriseInput } from '../../models/entreprise-input';
// Le composant enfant, pour le retrouver avec By.directive.
import { FormEntreprise } from '../../ui/form-entreprise/form-entreprise';
// Le composant testé.
import PageAjouterEntreprise from './page-ajouter-entreprise';

describe('PageAjouterEntreprise', () => {
  let fixture: ComponentFixture<PageAjouterEntreprise>;
  let element: HTMLElement;
  // Espion sur Router.navigateByUrl : on vérifie l'appel sans vraiment naviguer.
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  // Le faux service : seule la méthode utilisée par la page (creer) est fournie.
  let fauxService: { creer: ReturnType<typeof vi.fn> };

  // Les données « saisies » dans le formulaire.
  const nouvelleEntreprise: EntrepriseInput = { nom: 'DataCorp', secteur: 'Data & IA' };

  beforeEach(async () => {
    // vi.fn() crée une fonction espion : elle enregistre ses appels (arguments, nombre d'appels)
    // et on peut lui dicter ce qu'elle renvoie. Recréée à chaque test : aucun état partagé.
    fauxService = { creer: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PageAjouterEntreprise],
      providers: [
        // Un routeur sans routes : suffisant pour routerLink et navigateByUrl.
        provideRouter([]),
        // « Quand quelqu'un demande EntreprisesService, donne-lui fauxService. »
        { provide: EntreprisesService, useValue: fauxService },
      ],
    }).compileComponents();

    // vi.spyOn remplace navigateByUrl du vrai Router par un espion.
    // mockResolvedValue(true) : l'espion renvoie une Promise résolue avec true (« navigation
    // réussie »), sans changer de page pour de bon.
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(PageAjouterEntreprise);
    element = fixture.nativeElement;
    // whenStable() : attend que la page soit affichée. Sans danger ici : pas de requête HTTP.
    await fixture.whenStable();
  });

  // Simule la validation du formulaire : on retrouve le composant enfant FormEntreprise et on fait
  // émettre son output « valider », comme s'il était valide et que l'utilisateur avait cliqué.
  function validerLeFormulaire(entreprise: EntrepriseInput): void {
    const formulaire: FormEntreprise = fixture.debugElement.query(
      By.directive(FormEntreprise),
    ).componentInstance;
    formulaire.valider.emit(entreprise);
  }

  // ajouter() est une fonction async : après l'émission, la suite (après chaque await) s'exécute
  // plus tard. setTimeout(resolve) laisse toutes les promesses se terminer, puis whenStable()
  // attend que l'écran soit à jour.
  async function attendreLaFinDeLAjout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  // Cherche un élément par son texte (ce que l'utilisateur lit), pas par une classe CSS.
  function parTexte<T extends HTMLElement>(selecteur: string, texte: string): T | undefined {
    return Array.from(element.querySelectorAll<T>(selecteur)).find(
      (e) => e.textContent?.trim() === texte,
    );
  }

  it('affiche le titre et le formulaire avec un bouton « Ajouter »', () => {
    // Arrange : la page est affichée (beforeEach).

    // Act : on cherche le formulaire enfant (By.directive renvoie null s'il est absent).
    const formulaire = fixture.debugElement.query(By.directive(FormEntreprise));

    // Assert : le titre, le formulaire, et son bouton dont le libellé a été passé en input.
    expect(element.querySelector('h1')?.textContent).toBe('Ajouter une entreprise');
    expect(formulaire).not.toBeNull();
    expect(parTexte('button', 'Ajouter')).toBeTruthy();
  });

  it('propose un lien de retour vers la liste', () => {
    // Arrange : la page est affichée (beforeEach).

    // Act : on cherche le lien par son texte.
    const lienRetour = parTexte<HTMLAnchorElement>('a', 'Retour à la liste des entreprises');

    // Assert : routerLink a calculé le href de la liste.
    expect(lienRetour?.getAttribute('href')).toBe('/entreprises');
  });

  it("crée l'entreprise puis revient à la liste", async () => {
    // Arrange : le faux service répond comme l'API (l'entreprise créée, avec son id).
    // mockResolvedValue : la fonction renvoie une Promise qui réussit avec cette valeur.
    fauxService.creer.mockResolvedValue({ id: 5, ...nouvelleEntreprise });

    // Act : le formulaire est validé, puis on attend la fin de ajouter().
    validerLeFormulaire(nouvelleEntreprise);
    await attendreLaFinDeLAjout();

    // Assert : le service a reçu les données saisies, puis la page a navigué vers la liste.
    expect(fauxService.creer).toHaveBeenCalledWith(nouvelleEntreprise);
    expect(navigateByUrl).toHaveBeenCalledWith('/entreprises');
  });

  it('affiche une erreur et reste sur la page si la création échoue', async () => {
    // Arrange : le faux service échoue, comme l'API en panne.
    // mockRejectedValue : la fonction renvoie une Promise rejetée (le catch de la page s'exécute).
    fauxService.creer.mockRejectedValue(new Error('erreur'));

    // Act : le formulaire est validé, puis on attend la fin de ajouter().
    validerLeFormulaire(nouvelleEntreprise);
    await attendreLaFinDeLAjout();

    // Assert : le message d'erreur est annoncé (role="alert") et aucune navigation n'a eu lieu.
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      "L'entreprise n'a pas pu être ajoutée.",
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
