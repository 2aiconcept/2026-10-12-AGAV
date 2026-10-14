import { Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LayoutPages } from '../../../shared/layout-pages/layout-pages';
import { EntreprisesService } from '../../data-access/entreprises-service';
import { Entreprise } from '../../models/entreprise';

@Component({
  imports: [AsyncPipe, RouterLink, LayoutPages],
  selector: 'app-page-entreprises',
  styleUrl: './page-entreprises.css',
  templateUrl: './page-entreprises.html',
})
export default class PageEntreprises {
  private readonly entreprisesService = inject(EntreprisesService);
  private readonly destroyRef = inject(DestroyRef);

  // Observable froid : la requête part quand le pipe async du template s'y abonne.
  protected entreprises$ = this.entreprisesService.lister();

  protected supprimer(entreprise: Entreprise): void {
    if (!confirm(`Supprimer l'entreprise ${entreprise.nom} ?`)) {
      return;
    }
    this.entreprisesService
      .supprimer(entreprise.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recharger());
  }

  // Un nouvel observable : le pipe async s'y abonne, ce qui relance la requête GET.
  private recharger(): void {
    this.entreprises$ = this.entreprisesService.lister();
  }
}
