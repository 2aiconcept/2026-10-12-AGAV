// Component : décorateur qui transforme la classe en composant Angular.
// inject : récupère un service (ou un store) sans passer par le constructeur.
import { Component, inject } from '@angular/core';
// RouterLink : directive des liens de navigation (<a routerLink="…">), sans rechargement.
import { RouterLink } from '@angular/router';
// Mise en page commune des pages de liste (en-tête, contenu, pied), dans shared/.
import { LayoutPages } from '../../../shared/layout-pages/layout-pages';
// Le store NgRx de la feature : il garde la liste et l'état du chargement.
import { EntreprisesStore } from '../../data-access/entreprises-store';
// Le type d'une entreprise.
import { Entreprise } from '../../models/entreprise';

// Composant « smart » (page routée) : il injecte le store et orchestre l'affichage.
@Component({
  // Ce que le template utilise : les liens (RouterLink) et la mise en page (LayoutPages).
  imports: [RouterLink, LayoutPages],
  // Balise du composant (peu utilisée ici : la page est affichée par le routeur).
  selector: 'app-page-entreprises',
  // Feuille de style du composant (vide : classes Bootstrap uniquement).
  styleUrl: './page-entreprises.css',
  // Template HTML de la page.
  templateUrl: './page-entreprises.html',
})
// « export default » : la route peut charger la page en lazy loading sans .then(m => m.…).
export default class PageEntreprises {
  // Le store des entreprises. « protected » : le template lit directement ses signals
  // (store.entreprises(), store.isLoading(), store.erreur(), store.nombre()).
  protected readonly store = inject(EntreprisesStore);

  // Le constructeur s'exécute à chaque arrivée sur la page.
  constructor() {
    // Le store est partagé (providedIn: 'root') : sa liste peut dater d'une visite précédente.
    // On la relit sur l'API à chaque arrivée : l'API reste la seule source de vérité.
    this.store.charger();
  }

  // ---------------------------------------------------------------------------
  // Versions précédentes, gardées pour comparer
  // ---------------------------------------------------------------------------

  // Version 2 : une ressource HTTP créée par la page, relue avec reload() après suppression.
  // private readonly entreprisesService = inject(EntreprisesService);
  // protected readonly entreprises = this.entreprisesService.lister();
  //
  // protected async supprimer(entreprise: Entreprise): Promise<void> {
  //   if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
  //     return;
  //   }
  //   await this.entreprisesService.supprimer(entreprise.id);
  //   this.entreprises.reload();
  // }

  // Version 1 : Observable, subscribe et takeUntilDestroyed.
  // protected supprimer(entreprise: Entreprise): void {
  //   if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
  //     return;
  //   }
  //   this.entreprisesService
  //     .supprimer(entreprise.id)
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe(() => this.entreprises.reload());
  // }

  // Appelée au clic sur « Supprimer ». « async » permet d'attendre la réponse avec « await ».
  protected async supprimer(entreprise: Entreprise): Promise<void> {
    // confirm() affiche une boîte de confirmation du navigateur (OK = true, Annuler = false).
    if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
      // L'utilisateur a annulé : on s'arrête là (« retour anticipé »).
      return;
    }
    // Le store supprime sur l'API puis relit la liste : le tableau se met à jour tout seul,
    // puisque le template lit les signals du store.
    await this.store.supprimer(entreprise.id);
  }
}
