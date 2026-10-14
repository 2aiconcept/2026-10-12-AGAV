// Component : décorateur qui transforme la classe en composant Angular.
// inject : récupère un service sans passer par le constructeur.
import { Component, inject } from '@angular/core';
// RouterLink : directive des liens de navigation (<a routerLink="…">), sans rechargement.
import { RouterLink } from '@angular/router';
// Mise en page commune des pages de liste (en-tête, contenu, pied), dans shared/.
import { LayoutPages } from '../../../shared/layout-pages/layout-pages';
// Le service qui parle à l'API des entreprises.
import { EntreprisesService } from '../../data-access/entreprises-service';
// Le type d'une entreprise.
import { Entreprise } from '../../models/entreprise';

// Composant « smart » (page routée) : il injecte le service et orchestre l'affichage.
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
  // Le service des entreprises, réservé à la classe (private) et jamais réaffecté (readonly).
  private readonly entreprisesService = inject(EntreprisesService);

  // Ressource HTTP : sa valeur est toujours la dernière réponse de l'API, jamais un état local.
  // La requête GET part dès la création de la page. Le template lit ses signals :
  // value(), hasValue(), error()… « protected » : utilisée seulement par le template.
  protected readonly entreprises = this.entreprisesService.lister();

  // Version précédente (Observable) :
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
  // Après la suppression, on relit la liste sur l'API (elle a pu changer pour d'autres raisons).
  protected async supprimer(entreprise: Entreprise): Promise<void> {
    // confirm() affiche une boîte de confirmation du navigateur (OK = true, Annuler = false).
    if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
      // L'utilisateur a annulé : on s'arrête là (« retour anticipé »).
      return;
    }
    // On attend la fin de la requête DELETE. Si elle échoue, l'exception remonte et la suite
    // n'est pas exécutée (pas de rechargement).
    await this.entreprisesService.supprimer(entreprise.id);
    // On relance le GET : la liste affichée redevient celle de l'API.
    this.entreprises.reload();
  }
}
