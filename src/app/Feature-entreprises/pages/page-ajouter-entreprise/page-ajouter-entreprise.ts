// signal : une valeur réactive ; quand elle change, le template se met à jour tout seul.
import { Component, inject, signal } from '@angular/core';
// Router : pour naviguer depuis le code ; RouterLink : pour les liens du template.
import { Router, RouterLink } from '@angular/router';
// Le store NgRx des entreprises : il crée l'entreprise sur l'API puis relit la liste.
import { EntreprisesStore } from '../../data-access/entreprises-store';
// Le type des données saisies dans le formulaire.
import { EntrepriseInput } from '../../models/entreprise-input';
// Le formulaire partagé avec la page de modification.
import { FormEntreprise } from '../../ui/form-entreprise/form-entreprise';

// Page vers laquelle on revient après l'ajout.
const PAGE_LISTE = '/entreprises';

// Composant « smart » : il injecte le service et le routeur, et réagit au formulaire.
@Component({
  // RouterLink pour le lien « Retour », FormEntreprise pour le formulaire.
  imports: [RouterLink, FormEntreprise],
  selector: 'app-page-ajouter-entreprise',
  styleUrl: './page-ajouter-entreprise.css',
  templateUrl: './page-ajouter-entreprise.html',
})
export default class PageAjouterEntreprise {
  // Le store des entreprises (version précédente : le service, inject(EntreprisesService)).
  private readonly store = inject(EntreprisesStore);
  // Le routeur, pour revenir à la liste après l'ajout.
  private readonly router = inject(Router);

  // Vrai si la création a échoué : le template affiche alors un message d'erreur.
  // Booléen nommé comme une question (« a une erreur ? »).
  protected readonly hasError = signal(false);

  // Appelée quand le formulaire émet « valider » (formulaire valide).
  protected async ajouter(entreprise: EntrepriseInput): Promise<void> {
    // On efface une éventuelle erreur précédente.
    this.hasError.set(false);
    // try / catch : si une instruction avec « await » échoue, on passe dans le catch.
    try {
      // Version précédente : await this.entreprisesService.creer(entreprise);
      // Le store crée l'entreprise sur l'API (POST) puis relit la liste (GET).
      await this.store.ajouter(entreprise);
      // Puis on revient à la liste, qui relira l'API.
      await this.router.navigateByUrl(PAGE_LISTE);
    } catch {
      // La création a échoué : on reste sur la page et on affiche un message.
      this.hasError.set(true);
    }
  }
}
