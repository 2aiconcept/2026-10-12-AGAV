// computed : un signal calculé à partir d'autres signals.
// inject : récupère un service (ici EntreprisesService) dans le store.
import { computed, inject } from '@angular/core';
// Les briques de NgRx Signal Store :
// - signalStore : crée la classe du store ;
// - withState : déclare l'état (les données) du store ;
// - withComputed : ajoute des valeurs calculées à partir de l'état ;
// - withMethods : ajoute les actions (méthodes) qui modifient l'état ;
// - patchState : met à jour une partie de l'état (les autres champs ne bougent pas).
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
// Le service qui parle à l'API : le store s'en sert, il ne le remplace pas.
import { EntreprisesService } from './entreprises-service';
// Les types des données reçues et envoyées.
import { Entreprise } from '../models/entreprise';
import { EntrepriseInput } from '../models/entreprise-input';

// La forme de l'état du store : tout ce dont les pages ont besoin pour afficher la liste.
type EtatEntreprises = {
  // La liste, telle que l'API l'a renvoyée la dernière fois.
  entreprises: Entreprise[];
  // Vrai pendant un chargement (pour afficher « Chargement… »).
  isLoading: boolean;
  // Message d'erreur du dernier chargement, ou null s'il n'y en a pas.
  erreur: string | null;
};

// L'état au démarrage : rien de chargé, pas de chargement en cours, pas d'erreur.
const ETAT_INITIAL: EtatEntreprises = {
  entreprises: [],
  isLoading: false,
  erreur: null,
};

// Message affiché si la liste ne peut pas être chargée.
const MESSAGE_ERREUR_CHARGEMENT = 'Impossible de charger les entreprises. Réessayez plus tard.';

// signalStore() crée une CLASSE injectable (comme un service) : on l'injecte avec
// inject(EntreprisesStore). Chaque « with… » ajoute une couche, dans l'ordre :
// chaque couche peut utiliser ce que les couches précédentes ont déclaré.
//
// Règle du projet : l'API est la SEULE source de vérité (application multi-utilisateur).
// L'état n'est donc jamais modifié « à la main » (pas d'ajout ni de retrait dans la liste) :
// après chaque écriture, le store relit la liste sur l'API.
export const EntreprisesStore = signalStore(
  // providedIn: 'root' : une seule instance, partagée par toute l'application (comme
  // @Service()). La liste chargée par une page est donc visible par les autres pages.
  { providedIn: 'root' },

  // 1. L'état : chaque champ devient un signal en lecture seule pour l'extérieur :
  //    store.entreprises(), store.isLoading(), store.erreur().
  withState(ETAT_INITIAL),

  // 2. Les valeurs calculées : elles se mettent à jour toutes seules quand l'état change.
  //    On reçoit l'état sous forme de signals (ici on n'utilise que « entreprises »).
  withComputed(({ entreprises }) => ({
    // Nombre d'entreprises affichées (pour le pied de la page liste).
    nombre: computed(() => entreprises().length),
  })),

  // 3. Les méthodes : les actions que les pages appellent.
  //    « store » donne accès à l'état (et permet de le modifier avec patchState).
  //    La fonction s'exécute dans un contexte d'injection : inject() y fonctionne.
  withMethods((store, entreprisesService = inject(EntreprisesService)) => {
    // Relit la liste sur l'API et la range dans l'état.
    // Déclarée à part pour être réutilisée après chaque écriture.
    async function charger(): Promise<void> {
      // On signale le début du chargement et on efface une ancienne erreur.
      patchState(store, { isLoading: true, erreur: null });
      try {
        // On attend la réponse de l'API (GET /entreprises).
        const entreprises = await entreprisesService.chargerListe();
        // L'état prend exactement la réponse de l'API : c'est elle, la source de vérité.
        patchState(store, { entreprises });
      } catch {
        // La requête a échoué : on garde un message pour l'afficher.
        patchState(store, { erreur: MESSAGE_ERREUR_CHARGEMENT });
      } finally {
        // Dans tous les cas (succès ou erreur), le chargement est terminé.
        patchState(store, { isLoading: false });
      }
    }

    // L'objet renvoyé : les méthodes publiques du store, appelées par les pages.
    return {
      // store.charger() : relire la liste.
      charger,

      // Crée une entreprise sur l'API, puis relit la liste.
      // Si l'API refuse, l'erreur remonte à la page (qui affiche son message) : on ne
      // recharge pas, puisque rien n'a changé.
      async ajouter(entreprise: EntrepriseInput): Promise<void> {
        await entreprisesService.creer(entreprise);
        await charger();
      },

      // Modifie l'entreprise « id » sur l'API, puis relit la liste.
      async modifier(id: number, entreprise: EntrepriseInput): Promise<void> {
        await entreprisesService.modifier(id, entreprise);
        await charger();
      },

      // Supprime l'entreprise « id » sur l'API, puis relit la liste.
      async supprimer(id: number): Promise<void> {
        await entreprisesService.supprimer(id);
        await charger();
      },
    };
  }),
);
