import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EntreprisesService } from '../../data-access/entreprises-service';
import { EntrepriseInput } from '../../models/entreprise-input';
import { FormEntreprise } from '../../ui/form-entreprise/form-entreprise';

const PAGE_LISTE = '/entreprises';

@Component({
  imports: [RouterLink, FormEntreprise],
  selector: 'app-page-ajouter-entreprise',
  styleUrl: './page-ajouter-entreprise.css',
  templateUrl: './page-ajouter-entreprise.html',
})
export default class PageAjouterEntreprise {
  private readonly entreprisesService = inject(EntreprisesService);
  private readonly router = inject(Router);

  protected readonly hasError = signal(false);

  // De retour sur la liste, une nouvelle ressource relit l'API : la nouvelle entreprise y est.
  protected async ajouter(entreprise: EntrepriseInput): Promise<void> {
    this.hasError.set(false);
    try {
      await this.entreprisesService.creer(entreprise);
      await this.router.navigateByUrl(PAGE_LISTE);
    } catch {
      this.hasError.set(true);
    }
  }
}
