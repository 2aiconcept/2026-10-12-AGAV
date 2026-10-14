/*
 * Ce qu'il faut tester : EntreprisesStore (NgRx Signal Store)
 * -----------------------------------------------------------
 * Le store garde l'état de la liste des entreprises et propose des actions. On vérifie ce
 * qu'il EXPOSE (ses signals) et ce qu'il DEMANDE au service, pour chaque action :
 *  - l'état de départ : liste vide, pas de chargement, pas d'erreur, nombre = 0 ;
 *  - charger() : isLoading vaut true pendant l'attente, puis la liste prend EXACTEMENT la
 *    réponse de l'API et nombre() suit ; en cas d'échec, un message d'erreur est rangé ;
 *  - un nouveau chargement efface l'erreur précédente ;
 *  - ajouter(), modifier(), supprimer() : appellent la bonne méthode du service, PUIS relisent
 *    la liste sur l'API (règle du projet : l'API est la seule source de vérité) ;
 *  - si l'écriture échoue, la liste n'est pas relue et l'erreur remonte à l'appelant (la page
 *    affiche son propre message).
 * On ne teste PAS l'intérieur de NgRx (patchState, withState…) : seulement le résultat visible.
 *
 * Stratégie :
 *  - on remplace EntreprisesService par un FAUX : des fonctions espions vi.fn() qui renvoient
 *    des Promises choisies par chaque test. Pas de HTTP : on teste le store seul ;
 *  - le store est providedIn: 'root' : TestBed.inject(EntreprisesStore) le crée, en lui
 *    donnant notre faux service.
 */

// TestBed : crée un mini-environnement Angular pour le test (injection de dépendances).
import { TestBed } from '@angular/core/testing';
// Mock : le type d'une fonction espion créée par vi.fn().
import { Mock } from 'vitest';
// Le service que l'on remplace par un faux.
import { EntreprisesService } from './entreprises-service';
// Le store testé.
import { EntreprisesStore } from './entreprises-store';
// Les types des données.
import { Entreprise } from '../models/entreprise';
import { EntrepriseInput } from '../models/entreprise-input';

// La forme de notre faux service : seulement les méthodes que le store utilise.
type FauxService = {
  chargerListe: Mock<() => Promise<Entreprise[]>>;
  creer: Mock<(entreprise: EntrepriseInput) => Promise<Entreprise>>;
  modifier: Mock<(id: number, entreprise: EntrepriseInput) => Promise<Entreprise>>;
  supprimer: Mock<(id: number) => Promise<void>>;
};

// Données d'exemple, comme l'API pourrait les renvoyer.
const TECHVISION: Entreprise = { id: 1, nom: 'TechVision', secteur: 'IT & Cloud' };
const STRATCONSEIL: Entreprise = { id: 2, nom: 'StratConseil', secteur: 'Conseil' };

describe('EntreprisesStore', () => {
  // Recréés avant chaque test : aucun test ne voit les appels d'un autre.
  let fauxService: FauxService;
  let store: InstanceType<typeof EntreprisesStore>;

  beforeEach(() => {
    // Un faux service neuf. Par défaut, l'API « renvoie » une liste vide et accepte tout.
    // mockResolvedValue(x) : la fonction renvoie une Promise résolue avec x.
    fauxService = {
      chargerListe: vi.fn().mockResolvedValue([]),
      creer: vi.fn().mockResolvedValue(TECHVISION),
      modifier: vi.fn().mockResolvedValue(TECHVISION),
      supprimer: vi.fn().mockResolvedValue(undefined),
    };

    // « Quand le store demande EntreprisesService, donne-lui notre faux objet. »
    TestBed.configureTestingModule({
      providers: [{ provide: EntreprisesService, useValue: fauxService }],
    });
    // TestBed crée le store (providedIn: 'root') avec le faux service.
    store = TestBed.inject(EntreprisesStore);
  });

  it("démarre avec une liste vide, sans chargement ni erreur", () => {
    // Arrange : rien, on regarde l'état initial.

    // Act : rien.

    // Assert : chaque champ de l'état est un signal, qu'on lit en l'appelant.
    expect(store.entreprises()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.erreur()).toBeNull();
    // nombre() est la valeur calculée (withComputed).
    expect(store.nombre()).toBe(0);
  });

  describe('charger', () => {
    it("passe isLoading à true pendant l'attente de l'API", () => {
      // Arrange : une Promise qui ne se termine jamais, pour « figer » le chargement.
      fauxService.chargerListe.mockReturnValue(new Promise(() => undefined));

      // Act : on lance le chargement SANS l'attendre (pas de await).
      store.charger();

      // Assert : le chargement est en cours.
      expect(store.isLoading()).toBe(true);
    });

    it("range la réponse de l'API dans la liste, et met à jour le nombre", async () => {
      // Arrange : l'API renvoie deux entreprises.
      fauxService.chargerListe.mockResolvedValue([TECHVISION, STRATCONSEIL]);

      // Act : on attend la fin du chargement (charger renvoie une Promise).
      await store.charger();

      // Assert : la liste est exactement la réponse, le nombre suit, le chargement est fini.
      expect(store.entreprises()).toEqual([TECHVISION, STRATCONSEIL]);
      expect(store.nombre()).toBe(2);
      expect(store.isLoading()).toBe(false);
    });

    it("range un message d'erreur si l'API échoue", async () => {
      // Arrange : mockRejectedValue : la Promise échoue (comme une erreur HTTP).
      fauxService.chargerListe.mockRejectedValue(new Error('500'));

      // Act : on attend la fin du chargement.
      await store.charger();

      // Assert : un message est disponible pour la page, et le chargement est terminé.
      expect(store.erreur()).toBe('Impossible de charger les entreprises. Réessayez plus tard.');
      expect(store.isLoading()).toBe(false);
    });

    it("efface l'erreur précédente lors d'un nouveau chargement réussi", async () => {
      // Arrange : un premier chargement en échec…
      fauxService.chargerListe.mockRejectedValueOnce(new Error('500'));
      await store.charger();
      // … puis l'API répond de nouveau correctement.
      fauxService.chargerListe.mockResolvedValue([TECHVISION]);

      // Act : nouveau chargement.
      await store.charger();

      // Assert : plus d'erreur, et la liste est là.
      expect(store.erreur()).toBeNull();
      expect(store.entreprises()).toEqual([TECHVISION]);
    });
  });

  describe('écritures : toujours suivies d’une relecture de l’API', () => {
    it("ajouter() crée l'entreprise puis relit la liste", async () => {
      // Arrange : après la création, l'API renvoie la liste avec la nouvelle entreprise.
      const nouvelle: EntrepriseInput = { nom: 'DataCorp' };
      fauxService.chargerListe.mockResolvedValue([{ id: 5, nom: 'DataCorp' }]);

      // Act : on ajoute.
      await store.ajouter(nouvelle);

      // Assert : création demandée avec les bonnes données, puis liste relue sur l'API.
      expect(fauxService.creer).toHaveBeenCalledWith(nouvelle);
      expect(fauxService.chargerListe).toHaveBeenCalledTimes(1);
      expect(store.entreprises()).toEqual([{ id: 5, nom: 'DataCorp' }]);
    });

    it("modifier() modifie l'entreprise puis relit la liste", async () => {
      // Arrange : la liste relue contient le nouveau nom.
      fauxService.chargerListe.mockResolvedValue([{ ...TECHVISION, nom: 'TechVision SAS' }]);

      // Act : on modifie l'entreprise 1.
      await store.modifier(1, { nom: 'TechVision SAS' });

      // Assert : modification demandée, puis liste relue.
      expect(fauxService.modifier).toHaveBeenCalledWith(1, { nom: 'TechVision SAS' });
      expect(store.entreprises()[0].nom).toBe('TechVision SAS');
    });

    it("supprimer() supprime l'entreprise puis relit la liste", async () => {
      // Arrange : après suppression, l'API ne renvoie plus que StratConseil.
      fauxService.chargerListe.mockResolvedValue([STRATCONSEIL]);

      // Act : on supprime l'entreprise 1.
      await store.supprimer(1);

      // Assert : suppression demandée, puis liste relue (la liste vient de l'API, pas d'un
      // retrait « à la main » dans l'état).
      expect(fauxService.supprimer).toHaveBeenCalledWith(1);
      expect(store.entreprises()).toEqual([STRATCONSEIL]);
    });

    it("ne relit pas la liste et transmet l'erreur si l'écriture échoue", async () => {
      // Arrange : l'API refuse la création.
      fauxService.creer.mockRejectedValue(new Error('400'));

      // Act + Assert : rejects vérifie que la Promise échoue (l'erreur remonte à la page).
      await expect(store.ajouter({ nom: 'DataCorp' })).rejects.toThrow('400');
      // Rien n'a changé côté API : pas de relecture inutile.
      expect(fauxService.chargerListe).not.toHaveBeenCalled();
    });
  });
});
