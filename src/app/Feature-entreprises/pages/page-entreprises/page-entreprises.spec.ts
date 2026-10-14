// =================================================================================================
// Ce qu'il faut tester : PageEntreprises (page liste, composant smart)
// =================================================================================================
// On se met à la place de l'utilisateur et on vérifie ce qu'il VOIT et ce que ses clics PROVOQUENT :
// - les trois états de l'écran : « Chargement… » pendant la requête, le tableau quand les données
//   arrivent (ou « Aucune entreprise. » si la liste est vide), un message d'erreur si l'API échoue ;
// - le contenu du tableau : une ligne par entreprise, le compteur en pied de page ;
// - les liens de navigation : « Ajouter une entreprise » et « Modifier » pointent vers la bonne URL ;
// - la suppression : confirmation demandée, DELETE envoyé, puis la liste est RELUE sur l'API
//   (c'est la réponse de l'API qui est affichée, pas une liste modifiée localement) ;
// - l'annulation : si l'utilisateur répond « Annuler », rien n'est supprimé.
//
// Ce qu'on ne teste PAS : les signals du store (store.entreprises()…) ni le nom de ses méthodes.
// On observe uniquement l'écran et les requêtes HTTP qui sortent.
//
// Stratégie : on garde le VRAI EntreprisesStore et le VRAI EntreprisesService, et on remplace
// seulement le réseau par HttpTestingController. C'est un test « d'intégration » : il couvre tout
// le trajet page → store → service → requête HTTP, et on choisit les réponses de l'API.
// Les autres pages, elles, remplacent le store par un faux (test de la page seule). Ici, on veut
// justement vérifier que la liste affichée est bien celle que l'API renvoie après chaque action.
// (Le store est providedIn: 'root' : TestBed en recrée un neuf pour chaque test.)
// =================================================================================================

// ComponentFixture : l'enveloppe de test autour du composant (accès au DOM, whenStable…).
// TestBed : le banc d'essai qui crée l'environnement Angular du test.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// provideHttpClient : fournit HttpClient, utilisé par le vrai service.
import { provideHttpClient } from '@angular/common/http';
// Le faux backend : les requêtes restent en attente jusqu'à ce que le test y réponde.
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
// provideRouter : nécessaire car la page utilise routerLink (les liens ont besoin du routeur
// pour calculer leur attribut href). Une liste de routes vide suffit : on ne navigue pas.
import { provideRouter } from '@angular/router';
// L'URL de base de l'API, pour construire les URL attendues.
import { environment } from '../../../../environments/environment';
// Le type des données renvoyées par l'API.
import { Entreprise } from '../../models/entreprise';
// Le composant testé (export default, donc import sans accolades).
import PageEntreprises from './page-entreprises';

// URL de la liste des entreprises sur l'API.
const URL_ENTREPRISES = `${environment.apiBaseUrl}/entreprises`;
// Texte affiché tant que l'API n'a pas répondu.
const MESSAGE_CHARGEMENT = 'Chargement des entreprises…';

describe('PageEntreprises', () => {
  // Recréés avant chaque test : chaque test part d'une page neuve.
  let fixture: ComponentFixture<PageEntreprises>;
  // L'élément HTML racine de la page : c'est dans son DOM qu'on cherche ce qui est affiché.
  let element: HTMLElement;
  let httpTesting: HttpTestingController;

  // Jeu de données : deux entreprises renvoyées par l'API.
  const entreprises: Entreprise[] = [
    {
      id: 1,
      nom: 'TechVision',
      secteur: 'IT & Cloud',
      adresse: 'Paris',
      telephone: '01 45 67 89 00',
    },
    {
      id: 2,
      nom: 'StratConseil',
      secteur: 'Conseil',
      adresse: 'Lyon',
      telephone: '04 72 33 45 00',
    },
  ];

  beforeEach(async () => {
    // On déclare le composant testé (standalone : il va dans imports) et les providers.
    await TestBed.configureTestingModule({
      imports: [PageEntreprises],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    // createComponent : crée la page ; son constructeur s'exécute et appelle store.charger() :
    // la requête GET part tout de suite vers le faux backend.
    fixture = TestBed.createComponent(PageEntreprises);
    element = fixture.nativeElement;
    // PIÈGE : on n'appelle PAS fixture.whenStable() ici. Une requête HttpClient en attente compte
    // comme du travail en cours pour Angular : whenStable() attendrait la réponse, que personne ne
    // donne (le test bloquerait). TestBed.tick() lance seulement un cycle de détection des
    // changements : la page s'affiche dans l'état « Chargement… ».
    TestBed.tick();
  });

  afterEach(() => {
    // Aucune requête oubliée : chaque requête envoyée a reçu une réponse dans le test.
    httpTesting.verify();
  });

  // Après un flush qui termine une fonction async (await dans le composant), la suite de cette
  // fonction (ce qui vient après le await) s'exécute un peu plus tard, dans une autre « tâche »
  // JavaScript. setTimeout(resolve) attend le tour suivant : toutes les promesses ont fini.
  function laisserFinirLesPromesses(): Promise<unknown> {
    return new Promise((resolve) => setTimeout(resolve));
  }

  // Le faux backend répond au GET de la liste, puis on attend l'affichage. Ici, whenStable() est
  // sans danger : il n'y a plus de requête en attente.
  async function repondreALaListe(reponse: Entreprise[]): Promise<void> {
    httpTesting.expectOne(URL_ENTREPRISES).flush(reponse);
    await laisserFinirLesPromesses();
    await fixture.whenStable();
  }

  // Les lignes de DONNÉES du tableau (dans <tbody>, sans la ligne d'en-tête).
  function lignesDuTableau(): HTMLTableRowElement[] {
    return Array.from(element.querySelectorAll('tbody tr'));
  }

  // Cherche un lien par son texte (ce que l'utilisateur lit), pas par une classe CSS.
  function lien(texte: string): HTMLAnchorElement | undefined {
    return Array.from(element.querySelectorAll('a')).find((a) => a.textContent?.includes(texte));
  }

  // Cherche un bouton par son nom accessible : texte visible + texte masqué (visually-hidden),
  // par exemple « Supprimer TechVision ». replace(/\s+/g, ' ') ramène les espaces et retours à la
  // ligne du HTML à un seul espace.
  function bouton(nomAccessible: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.replace(/\s+/g, ' ').trim() === nomAccessible,
    );
  }

  it('affiche le titre de la page', async () => {
    // Arrange : l'API renvoie la liste.
    await repondreALaListe(entreprises);

    // Act : rien, on observe l'affichage.

    // Assert : le titre principal (h1, rôle « heading » de niveau 1).
    expect(element.querySelector('h1')?.textContent).toBe('Entreprises');
  });

  it('affiche un lien « Ajouter une entreprise » vers la page de création', async () => {
    // Arrange : l'API renvoie la liste.
    await repondreALaListe(entreprises);

    // Act : on cherche le lien par son texte.
    const lienAjouter = lien('Ajouter une entreprise');

    // Assert : href est calculé par routerLink à partir de « /entreprises/ajouter ».
    expect(lienAjouter?.getAttribute('href')).toBe('/entreprises/ajouter');
  });

  it("affiche un message de chargement tant que l'API n'a pas répondu", async () => {
    // Arrange : la requête GET est partie (beforeEach) mais le test n'y a pas encore répondu.
    // Assert (avant) : le message de chargement est affiché.
    expect(element.textContent).toContain(MESSAGE_CHARGEMENT);

    // Act : l'API répond.
    await repondreALaListe(entreprises);

    // Assert (après) : le message a disparu, remplacé par le tableau.
    expect(element.textContent).not.toContain(MESSAGE_CHARGEMENT);
  });

  it('affiche une ligne par entreprise reçue', async () => {
    // Arrange + Act : l'API renvoie deux entreprises.
    await repondreALaListe(entreprises);

    // Assert : deux lignes, chacune avec les informations de son entreprise.
    const lignes = lignesDuTableau();
    expect(lignes.length).toBe(2);
    expect(lignes[0].textContent).toContain('TechVision');
    expect(lignes[0].textContent).toContain('IT & Cloud');
    expect(lignes[0].textContent).toContain('01 45 67 89 00');
    expect(lignes[1].textContent).toContain('StratConseil');
  });

  it("affiche le nombre d'entreprises en pied de page", async () => {
    // Arrange + Act : l'API renvoie deux entreprises.
    await repondreALaListe(entreprises);

    // Assert : le compteur reflète la réponse de l'API.
    expect(element.textContent).toContain('2 entreprise(s) affichée(s)');
  });

  it("affiche « Aucune entreprise. » quand l'API renvoie une liste vide", async () => {
    // Arrange + Act : l'API renvoie une liste vide.
    await repondreALaListe([]);

    // Assert : le message du bloc @empty et un compteur à 0.
    expect(element.textContent).toContain('Aucune entreprise.');
    expect(element.textContent).toContain('0 entreprise(s) affichée(s)');
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    // Arrange : rien de plus, la requête GET est en attente.

    // Act : l'API répond par une erreur 500, puis on attend l'affichage.
    httpTesting
      .expectOne(URL_ENTREPRISES)
      .flush({ message: 'erreur' }, { status: 500, statusText: 'Erreur serveur' });
    await laisserFinirLesPromesses();
    await fixture.whenStable();

    // Assert : le message est dans une zone role="alert" (annoncée par les lecteurs d'écran).
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Impossible de charger les entreprises.',
    );
  });

  describe('colonne Actions', () => {
    // Espion sur window.confirm (la boîte « OK / Annuler » du navigateur).
    let confirmer: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      // vi.spyOn remplace window.confirm par un espion : il enregistre ses appels, et
      // mockReturnValue(true) simule un clic sur « OK » (jsdom n'affiche aucune boîte).
      confirmer = vi.spyOn(window, 'confirm').mockReturnValue(true);
      // Chaque test de ce groupe démarre avec la liste affichée.
      await repondreALaListe(entreprises);
    });

    afterEach(() => {
      // On rend à window.confirm son comportement d'origine pour ne pas polluer les autres tests.
      confirmer.mockRestore();
    });

    it('affiche un lien « Modifier » vers la page de modification de chaque entreprise', () => {
      // Arrange : la liste est affichée (beforeEach).

      // Act : on cherche le lien dont le nom accessible contient « Modifier TechVision ».
      const lienModifier = lien('TechVision');

      // Assert : c'est bien le lien « Modifier », et il mène à /entreprises/1/modifier.
      expect(lienModifier?.textContent).toContain('Modifier');
      expect(lienModifier?.getAttribute('href')).toBe('/entreprises/1/modifier');
    });

    it("nomme chaque bouton « Supprimer » avec l'entreprise concernée", () => {
      // Arrange : la liste est affichée (beforeEach).

      // Act + Assert : un lecteur d'écran entend « Supprimer TechVision », pas seulement
      // « Supprimer » (sinon, impossible de savoir quelle ligne est concernée).
      expect(bouton('Supprimer TechVision')).toBeTruthy();
      expect(bouton('Supprimer StratConseil')).toBeTruthy();
    });

    it("demande confirmation, envoie un DELETE puis relit la liste sur l'API", async () => {
      // Arrange : la liste est affichée (beforeEach), confirm() répond « OK ».

      // Act 1 : clic sur « Supprimer TechVision ». La requête DELETE part tout de suite.
      bouton('Supprimer TechVision')?.click();
      const suppression = httpTesting.expectOne(`${URL_ENTREPRISES}/1`);
      suppression.flush(null);
      // Le store attend (await) la fin du DELETE avant de relire la liste : on laisse cette
      // promesse se terminer, ce qui fait partir le nouveau GET. PAS de whenStable() ici : ce GET
      // reste en attente tant qu'on n'y a pas répondu.
      await laisserFinirLesPromesses();
      // TestBed.tick() met l'écran à jour (sans attendre le GET).
      TestBed.tick();
      // Act 2 : l'API renvoie la liste à jour (TechVision n'y est plus).
      await repondreALaListe([entreprises[1]]);

      // Assert : la confirmation a été demandée, le bon verbe HTTP a été utilisé, et la liste
      // affichée est celle renvoyée par l'API.
      expect(confirmer).toHaveBeenCalledWith("Supprimer l'entreprise TechVision ?");
      expect(suppression.request.method).toBe('DELETE');
      expect(lignesDuTableau().length).toBe(1);
      expect(element.textContent).not.toContain('TechVision');
    });

    it("affiche la liste renvoyée par l'API, même si un collègue l'a changée entre-temps", async () => {
      // Arrange : une entreprise ajoutée par un autre utilisateur pendant ce temps.
      const ajouteeParUnCollegue: Entreprise = { id: 3, nom: 'ShopNow', secteur: 'E-commerce' };

      // Act : suppression de TechVision (voir le test précédent pour le détail des étapes)...
      bouton('Supprimer TechVision')?.click();
      httpTesting.expectOne(`${URL_ENTREPRISES}/1`).flush(null);
      await laisserFinirLesPromesses();
      TestBed.tick();
      // ... puis l'API renvoie une liste qui contient aussi l'entreprise du collègue.
      await repondreALaListe([entreprises[1], ajouteeParUnCollegue]);

      // Assert : l'écran montre la vérité de l'API, pas « l'ancienne liste moins une ligne ».
      expect(element.textContent).toContain('ShopNow');
      expect(lignesDuTableau().length).toBe(2);
    });

    it('ne supprime rien si on annule la confirmation', async () => {
      // Arrange : cette fois, confirm() simule un clic sur « Annuler ».
      confirmer.mockReturnValue(false);

      // Act : clic sur « Supprimer TechVision ». whenStable() est sans danger : aucune requête
      // n'est censée partir.
      bouton('Supprimer TechVision')?.click();
      await fixture.whenStable();

      // Assert : la question a été posée, mais aucune requête DELETE n'est partie
      // (expectNone échoue si une requête correspond) et les deux lignes sont toujours là.
      expect(confirmer).toHaveBeenCalled();
      httpTesting.expectNone(`${URL_ENTREPRISES}/1`);
      expect(lignesDuTableau().length).toBe(2);
    });
  });
});
