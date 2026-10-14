import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutPages } from '../../../shared/layout-pages/layout-pages';
import { EntreprisesService } from '../../data-access/entreprises-service';
import { Entreprise } from '../../models/entreprise';

@Component({
  imports: [RouterLink, LayoutPages],
  selector: 'app-page-entreprises',
  styleUrl: './page-entreprises.css',
  templateUrl: './page-entreprises.html',
})
export default class PageEntreprises {
  private readonly entreprisesService = inject(EntreprisesService);

  // Ressource HTTP : sa valeur est toujours la dernière réponse de l'API, jamais un état local.
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

  // Après la suppression, on relit la liste sur l'API (elle a pu changer pour d'autres raisons).
  protected async supprimer(entreprise: Entreprise): Promise<void> {
    if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
      return;
    }
    await this.entreprisesService.supprimer(entreprise.id);
    this.entreprises.reload();
  }
}
